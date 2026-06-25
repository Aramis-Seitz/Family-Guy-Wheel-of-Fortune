-- =========================================================
-- FILE: supabase/migrations/10_add_wheel_items_to_rooms.sql
-- PURPOSE: Add independent wheel_items text[] column to rooms
-- =========================================================

alter table public.rooms
  add column if not exists wheel_items text[] default '{}';

alter table public.rooms
  alter column wheel_items set default '{}';
