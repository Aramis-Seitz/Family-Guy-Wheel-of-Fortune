-- =========================================================
-- FILE: supabase/migrations/11_rooms_players_jsonb.sql
-- PURPOSE: Change players column from text[] to jsonb to store
--          {id, username} objects, enabling removal by userId
-- =========================================================

ALTER TABLE public.rooms
  ALTER COLUMN players DROP DEFAULT;

ALTER TABLE public.rooms
  ALTER COLUMN players TYPE jsonb USING '[]'::jsonb;

ALTER TABLE public.rooms
  ALTER COLUMN players SET DEFAULT '[]'::jsonb;
