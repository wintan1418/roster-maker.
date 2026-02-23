-- Add availability_token to rosters for targeted availability campaigns
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS availability_token TEXT UNIQUE;

-- Allow team members to read draft rosters that have an availability_token
-- (draft rosters are normally admin-only, but members need access for availability checks)
CREATE POLICY "Team members read roster via availability token"
  ON rosters FOR SELECT
  USING (
    availability_token IS NOT NULL
    AND team_id IN (
      SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()
    )
  );
