-- =========================================================
-- FILE: supabase/migrations/10_rooms_spin_direction.sql
-- PURPOSE: Add spin_direction column to rooms table so the
--          host's chosen spin direction is synced to all
--          guests via Realtime.
-- =========================================================

alter table public.rooms
  add column if not exists spin_direction text check (spin_direction in ('left', 'right'));
