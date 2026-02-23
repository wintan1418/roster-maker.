-- Add session column to availability table for session-level granularity
ALTER TABLE availability
  ADD COLUMN session TEXT NOT NULL DEFAULT 'all_day'
  CHECK (session IN ('all_day', 'morning', 'afternoon', 'evening'));

-- Drop old unique constraint and create new one including session
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_user_id_team_id_date_key;
ALTER TABLE availability ADD CONSTRAINT availability_user_team_date_session_key
  UNIQUE (user_id, team_id, date, session);
