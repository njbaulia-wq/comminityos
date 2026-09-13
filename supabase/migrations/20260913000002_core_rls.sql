BEGIN;

-- 1. Enable RLS on core identity and multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to fetch all active organization IDs for the current authenticated user
CREATE OR REPLACE FUNCTION get_auth_user_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT om.organization_id
  FROM organization_members om
  JOIN profiles p ON om.profile_id = p.id
  WHERE p.user_id = auth.uid()
    AND om.status = 'active'
    AND om.deleted_at IS NULL;
$$;

-- 3. Helper function to verify if auth user is Admin or Owner of an organization
CREATE OR REPLACE FUNCTION is_org_admin(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN profiles p ON om.profile_id = p.id
    JOIN roles r ON om.role_id = r.id
    WHERE om.organization_id = target_org_id
      AND p.user_id = auth.uid()
      AND om.status = 'active'
      AND r.name IN ('Owner', 'Admin')
      AND om.deleted_at IS NULL
  );
$$;

-- 4. Organization RLS Policies
CREATE POLICY "org_member_read_org" ON organizations
  FOR SELECT
  USING (
    id IN (SELECT org_id FROM get_auth_user_org_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_update_org" ON organizations
  FOR UPDATE
  USING (is_org_admin(id))
  WITH CHECK (is_org_admin(id));

-- 5. Organization Members RLS Policies
CREATE POLICY "org_member_read_members" ON organization_members
  FOR SELECT
  USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_members" ON organization_members
  FOR ALL
  USING (is_org_admin(organization_id));

-- 6. Profiles RLS Policies (Isolate profiles within shared active organizations)
CREATE POLICY "shared_org_members_read_profile" ON profiles
  FOR SELECT
  USING (
    id IN (
      SELECT om.profile_id
      FROM organization_members om
      WHERE om.organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
        AND om.deleted_at IS NULL
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
