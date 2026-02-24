-- Roster Review & Approval System
-- Adds review_token to rosters + roster_reviews table for external review workflow

-- 1. Add review_token column to rosters (works for any status, including draft)
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS review_token TEXT UNIQUE;

-- 2. Create roster_reviews table
CREATE TABLE IF NOT EXISTS roster_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE NOT NULL,
  reviewer_name TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'comment'
    CHECK (status IN ('approved', 'changes_requested', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roster_reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Anon can read rosters with a review_token (any status)
CREATE POLICY "Anon read roster via review token"
  ON rosters FOR SELECT
  TO anon
  USING (review_token IS NOT NULL);

-- 4. RLS: Anon can read roster_events for reviewable rosters
CREATE POLICY "Anon read roster events for review"
  ON roster_events FOR SELECT
  TO anon
  USING (
    roster_id IN (SELECT id FROM rosters WHERE review_token IS NOT NULL)
  );

-- 5. RLS: Anon can read team_members for reviewable rosters
CREATE POLICY "Anon read team members for review"
  ON team_members FOR SELECT
  TO anon
  USING (
    team_id IN (
      SELECT team_id FROM rosters
      WHERE review_token IS NOT NULL AND team_id IS NOT NULL
    )
  );

-- 6. RLS: Anon can read profiles for reviewable rosters
CREATE POLICY "Anon read profiles for review"
  ON profiles FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT tm.user_id FROM team_members tm
      WHERE tm.team_id IN (
        SELECT team_id FROM rosters
        WHERE review_token IS NOT NULL AND team_id IS NOT NULL
      )
    )
  );

-- 7. RLS: Anon can read event_songs for reviewable rosters
CREATE POLICY "Anon read event songs for review"
  ON event_songs FOR SELECT
  TO anon
  USING (
    roster_event_id IN (
      SELECT re.id FROM roster_events re
      WHERE re.roster_id IN (
        SELECT id FROM rosters WHERE review_token IS NOT NULL
      )
    )
  );

-- 8. RLS: Anon can read member_roles for reviewable rosters
CREATE POLICY "Anon read member roles for review"
  ON member_roles FOR SELECT
  TO anon
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      WHERE tm.team_id IN (
        SELECT team_id FROM rosters
        WHERE review_token IS NOT NULL AND team_id IS NOT NULL
      )
    )
  );

-- 9. RLS: Anon can INSERT roster_reviews
CREATE POLICY "Anon insert roster reviews"
  ON roster_reviews FOR INSERT
  TO anon
  WITH CHECK (
    roster_id IN (SELECT id FROM rosters WHERE review_token IS NOT NULL)
  );

-- 10. RLS: Anon can read roster_reviews (to show previous reviews on review page)
CREATE POLICY "Anon read roster reviews"
  ON roster_reviews FOR SELECT
  TO anon
  USING (
    roster_id IN (SELECT id FROM rosters WHERE review_token IS NOT NULL)
  );

-- 11. RLS: Authenticated users can read/insert reviews for their org's rosters
CREATE POLICY "Authenticated manage roster reviews"
  ON roster_reviews FOR ALL
  USING (
    roster_id IN (
      SELECT r.id FROM rosters r
      JOIN teams t ON t.id = r.team_id
      WHERE is_org_admin(t.org_id)
    )
  );

-- 12. Grant table permissions
GRANT SELECT, INSERT ON TABLE public.roster_reviews TO anon;
GRANT ALL ON TABLE public.roster_reviews TO authenticated;
