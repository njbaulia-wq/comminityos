BEGIN;

-- 1. Activities / Projects / Agenda table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'completed', 'cancelled')),
  budget_estimate NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (budget_estimate >= 0),
  pic_member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 2. Activity Members / Committee junction table
CREATE TABLE IF NOT EXISTS activity_members (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  role_in_activity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, member_id)
);

-- 3. Tasks / To-Do items table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- 4. Task Checklists sub-items table
CREATE TABLE IF NOT EXISTS task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable Row-Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for activities
CREATE POLICY "org_members_read_activities" ON activities
  FOR SELECT
  USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_activities" ON activities
  FOR ALL
  USING (is_org_admin(organization_id));

-- 7. RLS Policies for activity_members
CREATE POLICY "org_members_read_activity_members" ON activity_members
  FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM activities WHERE organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    )
  );

CREATE POLICY "org_admin_manage_activity_members" ON activity_members
  FOR ALL
  USING (
    activity_id IN (
      SELECT id FROM activities WHERE is_org_admin(organization_id)
    )
  );

-- 8. RLS Policies for tasks
CREATE POLICY "org_members_read_tasks" ON tasks
  FOR SELECT
  USING (
    organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "org_admin_manage_tasks" ON tasks
  FOR ALL
  USING (is_org_admin(organization_id));

-- 9. RLS Policies for task_checklists
CREATE POLICY "org_members_read_task_checklists" ON task_checklists
  FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE organization_id IN (SELECT org_id FROM get_auth_user_org_ids())
    )
  );

CREATE POLICY "org_admin_manage_task_checklists" ON task_checklists
  FOR ALL
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE is_org_admin(organization_id)
    )
  );

COMMIT;
