-- =========================================================
-- FILE: supabase/schemas/07_shop_rls_write.sql
-- PURPOSE: Shop write policies
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

create or replace policy "Users can insert own asset ownership"
on public.asset_ownership
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace policy "Users can insert own asset selection"
on public.asset_selection
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace policy "Users can update own asset selection"
on public.asset_selection
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);