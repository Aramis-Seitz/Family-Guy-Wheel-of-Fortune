-- =========================================================
-- FILE: supabase/schemas/02_rooms.sql
-- PURPOSE: Rooms schema + RLS + realtime
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

create table if not exists public.rooms (
    id uuid primary key default gen_random_uuid(),
    room_key text unique not null,
    host_id uuid references public.profiles(id) on delete cascade,
    players text[] default '{}',
    last_spin integer,
    spun_at timestamptz,
    created_at timestamptz default now()
);

alter table public.rooms enable row level security;

create policy "Users can read rooms"
on public.rooms
for select
to authenticated
using (true);

create policy "Host can update own room"
on public.rooms
for update
to authenticated
using (auth.uid() = host_id);

create policy "Users can create rooms"
on public.rooms
for insert
to authenticated
with check (auth.uid() = host_id);

alter publication supabase_realtime add table public.rooms;