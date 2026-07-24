-- =========================================================
-- FILE: supabase/migrations/24_unique_asset_name_category.sql
-- PURPOSE: Prevent duplicate public.asset rows (same character/sound
--          inserted more than once) from ever being created again.
-- NOTE: Must run after 23_dedupe_duplicate_assets.sql, which removes any
--       existing duplicates that would otherwise violate this constraint.
-- =========================================================

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'asset_name_category_unique'
    ) then
        alter table public.asset
            add constraint asset_name_category_unique unique (name, category);
    end if;
end $$;
