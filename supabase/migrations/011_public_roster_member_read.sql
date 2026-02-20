-- Allow anonymous users to read team_members and profiles
-- for teams that have at least one published roster (share_token is set).
-- This enables the public roster page to show member names and the
-- "View My Schedule" email lookup to work without authentication.

CREATE POLICY "Public can read team members for published rosters"
  ON team_members FOR SELECT
  TO anon
  USING (
    team_id IN (
      SELECT team_id FROM rosters
      WHERE status = 'published'
        AND share_token IS NOT NULL
        AND team_id IS NOT NULL
    )
  );

CREATE POLICY "Public can read profiles for published roster members"
  ON profiles FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT tm.user_id FROM team_members tm
      WHERE tm.team_id IN (
        SELECT team_id FROM rosters
        WHERE status = 'published'
          AND share_token IS NOT NULL
          AND team_id IS NOT NULL
      )
    )
  );
