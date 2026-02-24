-- Add link column to event_songs for YouTube/Spotify URLs
ALTER TABLE event_songs ADD COLUMN IF NOT EXISTS link TEXT;
