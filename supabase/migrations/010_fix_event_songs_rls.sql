-- Migration: Allow all team members to insert and delete songs
-- The existing FOR ALL policy only allows team admins.
-- This adds separate INSERT and DELETE policies for any team member.

-- Allow any team member to INSERT songs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_insert_event_songs') THEN
    CREATE POLICY team_members_insert_event_songs
      ON event_songs FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = event_songs.team_id
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow any team member to DELETE songs they added
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_delete_own_songs') THEN
    CREATE POLICY team_members_delete_own_songs
      ON event_songs FOR DELETE
      USING (
        added_by = auth.uid()
      );
  END IF;
END $$;
