-- ============================================================
-- Migration 009: 8 new features
-- ============================================================

-- 1. Pinned messages (Feature 8)
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Swap requests (Feature 1)
CREATE TABLE IF NOT EXISTS swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES roster_assignments(id) ON DELETE CASCADE,
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requester_name TEXT,
  role_name TEXT,
  event_date DATE,
  event_name TEXT,
  reason TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'filled', 'cancelled'
  filled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

-- Team members can read swap requests for their team
CREATE POLICY "team_members_read_swap_requests"
  ON swap_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = swap_requests.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team members can insert their own swap requests
CREATE POLICY "team_members_insert_swap_requests"
  ON swap_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = swap_requests.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team members can update (volunteer / cancel)
CREATE POLICY "team_members_update_swap_requests"
  ON swap_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = swap_requests.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- 3. Attendance records (Feature 4)
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'present', -- 'present', 'absent', 'excused'
  note TEXT,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roster_event_id, user_id)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Team admins and super admins can manage attendance for their team
CREATE POLICY "team_admin_manage_attendance"
  ON attendance_records
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  );

-- Members can read their own attendance
CREATE POLICY "members_read_own_attendance"
  ON attendance_records FOR SELECT
  USING (user_id = auth.uid());

-- 4. Event songs (Feature 6)
CREATE TABLE IF NOT EXISTS event_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  key TEXT,
  notes TEXT,
  sort_order INT DEFAULT 0,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_songs ENABLE ROW LEVEL SECURITY;

-- Team members can read songs
CREATE POLICY "team_members_read_event_songs"
  ON event_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = event_songs.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team admins can manage songs
CREATE POLICY "team_admin_manage_event_songs"
  ON event_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = event_songs.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = event_songs.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  );

-- 5. Member skill ratings (Feature 7)
CREATE TABLE IF NOT EXISTS member_skill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  team_role_id UUID REFERENCES team_roles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 3) DEFAULT 2,
  rated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_member_id, team_role_id)
);

ALTER TABLE member_skill_ratings ENABLE ROW LEVEL SECURITY;

-- Team admins can manage ratings
CREATE POLICY "team_admin_manage_skill_ratings"
  ON member_skill_ratings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = member_skill_ratings.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = member_skill_ratings.team_id
        AND tm.user_id = auth.uid()
        AND (tm.is_team_admin = true
          OR EXISTS (
            SELECT 1 FROM org_members om
            WHERE om.user_id = auth.uid()
              AND om.role IN ('super_admin', 'team_admin')
          )
        )
    )
  );

-- Team members can read ratings
CREATE POLICY "team_members_read_skill_ratings"
  ON member_skill_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = member_skill_ratings.team_id
        AND tm.user_id = auth.uid()
    )
  );
