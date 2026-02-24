-- Allow org admins (super_admin, team_admin) to manage availability for team members
CREATE POLICY "availability_admin_manage"
  ON availability FOR ALL
  USING (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ))
  WITH CHECK (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ));
