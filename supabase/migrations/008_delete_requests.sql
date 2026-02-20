-- Delete requests table: team_admin submits requests, super_admin approves/rejects
CREATE TABLE IF NOT EXISTS delete_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requester_name TEXT,
  target_type TEXT NOT NULL, -- 'team', 'member', 'role'
  target_id TEXT NOT NULL,
  target_name TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolver_note TEXT
);

-- Enable RLS
ALTER TABLE delete_requests ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_full_access_delete_requests"
  ON delete_requests
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = delete_requests.org_id
        AND om.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = delete_requests.org_id
        AND om.role = 'super_admin'
    )
  );

-- Any admin can insert requests
CREATE POLICY "admin_can_insert_delete_requests"
  ON delete_requests
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = delete_requests.org_id
        AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- Requesters can read their own requests
CREATE POLICY "requester_can_read_own"
  ON delete_requests
  FOR SELECT
  USING (requested_by = auth.uid());
