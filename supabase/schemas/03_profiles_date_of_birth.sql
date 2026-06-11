-- =========================================================
-- FILE: supabase/schemas/03_profiles_date_of_birth.sql
-- PURPOSE: Add date_of_birth to profiles
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

alter table public.profiles
add column date_of_birth date;