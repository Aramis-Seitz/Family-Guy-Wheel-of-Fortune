-- =========================================================
-- FILE: supabase/migrations/09_rooms_multiplier.sql
-- PURPOSE: Add multiplier column to rooms table so the host's
--          power-slider value is synced to all guests via Realtime.
-- =========================================================

alter table public.rooms
  add column if not exists multiplier numeric(4,1) not null default 1;
