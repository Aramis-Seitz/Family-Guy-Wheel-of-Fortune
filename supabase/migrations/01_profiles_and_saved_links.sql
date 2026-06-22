-- =========================================================
-- FILE: supabase/schemas/01_profiles_and_saved_links.sql
-- PURPOSE: Profiles and saved links base schema + RLS
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

-- Table: profiles
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text,
    email text,
    coins int8 default 1
);

alter table public.profiles enable row level security;

create or replace policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create or replace policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create or replace policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- Table: saved_links
create table if not exists public.saved_links (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    link_name text not null,
    url text not null,
    created_at timestamp with time zone default now()
);

alter table public.saved_links enable row level security;

create or replace policy "Users can read own links"
on public.saved_links
for select
to authenticated
using (auth.uid() = user_id);

create or replace policy "Users can insert own links"
on public.saved_links
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace policy "Users can update own links"
on public.saved_links
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace policy "Users can delete own links"
on public.saved_links
for delete
to authenticated
using (auth.uid() = user_id);