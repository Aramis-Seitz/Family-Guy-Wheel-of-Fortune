-- =========================================================
-- FILE: supabase/schemas/05_shop_rls_read.sql
-- PURPOSE: Shop RLS enablement + read policies
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

alter table public.asset enable row level security;
alter table public.asset_ownership enable row level security;
alter table public.asset_selection enable row level security;

create or replace policy "Users can read assets"
on public.asset
for select
to authenticated
using (true);

create or replace policy "Users can read own asset ownership"
on public.asset_ownership
for select
to authenticated
using (auth.uid() = user_id);

create or replace policy "Users can read own asset selection"
on public.asset_selection
for select
to authenticated
using (auth.uid() = user_id);