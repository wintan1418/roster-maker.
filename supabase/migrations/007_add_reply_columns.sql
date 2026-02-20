-- Add reply columns to team_messages if they don't exist yet
-- (For databases where team_messages was created before migration 006)
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES team_messages(id) ON DELETE SET NULL;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS reply_to_name TEXT;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS reply_to_content TEXT;
