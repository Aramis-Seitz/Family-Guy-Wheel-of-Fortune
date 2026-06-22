-- =========================================================
-- FILE: supabase/schemas/05_shop_rls_read.sql
-- PURPOSE: Shop RLS enablement + read policies
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

alter table public.asset enable row level security;
alter table public.asset_ownership enable row level security;
alter table public.asset_selection enable row level security;

drop policy if exists "Users can read assets" on public.asset;
create policy "Users can read assets"
on public.asset
for select
to authenticated
using (true);

drop policy if exists "Users can read own asset ownership" on public.asset_ownership;
create policy "Users can read own asset ownership"
on public.asset_ownership
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own asset selection" on public.asset_selection;
create policy "Users can read own asset selection"
on public.asset_selection
for select
to authenticated
using (auth.uid() = user_id);