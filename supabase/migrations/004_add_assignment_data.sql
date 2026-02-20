-- Add assignment_data JSONB column to rosters table.
-- Stores the full roster grid assignments as JSON, keyed by "eventId-roleSlotId".
-- This avoids the user_id/team_member_id mapping and slot duplication issues
-- that make the roster_assignments table impractical for the grid editor.

ALTER TABLE rosters ADD COLUMN IF NOT EXISTS assignment_data JSONB DEFAULT '{}';
