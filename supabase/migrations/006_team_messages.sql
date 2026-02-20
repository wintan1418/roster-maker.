-- Migration: Add team_messages table for team chat
-- If the table already exists (created manually), this will be a no-op via IF NOT EXISTS

CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES team_messages(id) ON DELETE SET NULL,
  reply_to_name TEXT,
  reply_to_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast team message lookups
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id, created_at);

-- RLS policies
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

-- Members can read messages from teams they belong to
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_messages_select') THEN
    CREATE POLICY team_messages_select ON team_messages FOR SELECT
      USING (
        team_id IN (
          SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Members can insert messages into their teams
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_messages_insert') THEN
    CREATE POLICY team_messages_insert ON team_messages FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND team_id IN (
          SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can delete their own messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_messages_delete') THEN
    CREATE POLICY team_messages_delete ON team_messages FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Enable Realtime for team_messages
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
