-- =========================================================
-- FILE: supabase/migrations/24_drop_asset_name_category_unique.sql
-- PURPOSE: Remove the asset_name_category_unique constraint. It was added
--          by the deleted 24_unique_asset_name_category.sql migration but
--          never removed from the DB when that file was deleted, so it kept
--          running live on prod without being tracked in migration history.
-- =========================================================

alter table public.asset
    drop constraint if exists asset_name_category_unique;
