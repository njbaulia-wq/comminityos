BEGIN;

-- 1. Add demographic fields to profiles for local Indonesian community tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rt_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rw_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resident_status TEXT DEFAULT 'tetap' CHECK (resident_status IN ('tetap', 'kontrak', 'kost', 'pindah', 'meninggal'));

-- 2. Create teams / divisions / sections table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 3. Create team_members junction table
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, member_id)
);

-- 4. Enable Row-Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for teams
CREATE POLICY "org_members_read_teams" ON teams
  FOR SELECT
  USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_teams" ON teams
  FOR ALL
  USING (is_org_admin(organization_id));

-- 6. RLS Policies for team_members
CREATE POLICY "org_members_read_team_members" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    )
  );

CREATE POLICY "org_admin_manage_team_members" ON team_members
  FOR ALL
  USING (
    team_id IN (
      SELECT id FROM teams WHERE is_org_admin(organization_id)
    )
  );

COMMIT;
