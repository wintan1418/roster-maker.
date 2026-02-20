-- ============================================================
-- Migration 010: Rehearsal times + reminder logs
-- ============================================================

-- Add rehearsal time fields to roster_events
ALTER TABLE roster_events ADD COLUMN IF NOT EXISTS rehearsal_time TIME;
ALTER TABLE roster_events ADD COLUMN IF NOT EXISTS rehearsal_note TEXT;

-- Track sent reminders to avoid duplicates
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL, -- '4h_rehearsal', '1h_service'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roster_event_id, reminder_type)
);

-- ============================================================
-- pg_cron setup: run this SEPARATELY in Supabase Dashboard
-- Dashboard → Database → Extensions → enable pg_cron & pg_net
-- Then run the cron.schedule() below in the SQL editor:
-- ============================================================
--
-- SELECT cron.schedule(
--   'send-roster-reminders',
--   '*/30 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
--     headers := '{"Authorization":"Bearer YOUR_ANON_KEY","Content-Type":"application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
