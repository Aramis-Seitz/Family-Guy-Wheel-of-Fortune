-- =========================================================
-- FILE: supabase/migrations/31_rooms_names_in_wheel_jsonb.sql
-- PURPOSE: Change names_in_wheel column from text[] to jsonb to store
--          { text, isPlayer } entries, so coin awarding can distinguish
--          server-verified player entries from hand-typed names.
-- =========================================================

alter table public.rooms
  alter column names_in_wheel drop default;

alter table public.rooms
  alter column names_in_wheel type jsonb using '[]'::jsonb;

alter table public.rooms
  alter column names_in_wheel set default '[]'::jsonb;
