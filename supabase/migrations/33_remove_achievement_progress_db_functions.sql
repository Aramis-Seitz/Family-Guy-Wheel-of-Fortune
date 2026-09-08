-- =========================================================
-- FILE: supabase/migrations/33_remove_achievement_progress_db_functions.sql
-- PURPOSE: Removes the DB-side achievement progress logic introduced in
--          30_achievement_progress_triggers.sql / 31_fix_increment_achievement_progress_bigint_param.sql.
--          Achievement progress is now computed in the application layer
--          (server/src/services/achievement-service.ts) instead of via
--          Postgres triggers/functions. The database keeps only schema
--          (tables, constraints, indexes, RLS policies).
-- =========================================================

begin;

drop trigger if exists trg_profiles_coins_achievement on public.profiles;
drop trigger if exists trg_spin_tokens_achievement on public.spin_tokens;
drop trigger if exists trg_asset_ownership_achievement on public.asset_ownership;

drop function if exists public.trg_profiles_coins_achievement();
drop function if exists public.trg_spin_tokens_achievement();
drop function if exists public.trg_asset_ownership_achievement();
drop function if exists public.fn_increment_achievement_progress(uuid, text, bigint);

commit;
