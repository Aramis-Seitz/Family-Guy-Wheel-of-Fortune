-- =========================================================
-- FILE: supabase/migrations/25_achievements.sql
-- PURPOSE: Achievements-System — Basistabellen, RLS-Policies und Seed-Daten.
-- =========================================================

begin;

create table if not exists public.achievement (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    category text not null,
    target int not null,
    icon_url text,
    constraint achievement_category_valid
        check (category in ('spin', 'shop_purchase', 'coins_total')),
    constraint achievement_target_positive
        check (target > 0)
);

create table if not exists public.user_achievement_progress (
    user_id uuid not null references public.profiles(id) on delete cascade,
    achievement_id uuid not null references public.achievement(id) on delete cascade,
    progress int not null default 0,
    updated_at timestamptz not null default now(),
    primary key (user_id, achievement_id)
);

create table if not exists public.user_achievement_unlocked (
    user_id uuid not null references public.profiles(id) on delete cascade,
    achievement_id uuid not null references public.achievement(id) on delete cascade,
    unlocked_at timestamptz not null default now(),
    primary key (user_id, achievement_id)
);

create index if not exists user_achievement_progress_user_id_idx
    on public.user_achievement_progress (user_id);

create index if not exists user_achievement_unlocked_user_id_idx
    on public.user_achievement_unlocked (user_id);

-- ── RLS ──

alter table public.achievement enable row level security;
alter table public.user_achievement_progress enable row level security;
alter table public.user_achievement_unlocked enable row level security;

drop policy if exists "Users can read achievements" on public.achievement;
create policy "Users can read achievements"
on public.achievement
for select
to authenticated
using (true);

drop policy if exists "Users can read own achievement progress" on public.user_achievement_progress;
create policy "Users can read own achievement progress"
on public.user_achievement_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own achievement progress" on public.user_achievement_progress;
create policy "Users can update own achievement progress"
on public.user_achievement_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own unlocked achievements" on public.user_achievement_unlocked;
create policy "Users can read own unlocked achievements"
on public.user_achievement_unlocked
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own unlocked achievements" on public.user_achievement_unlocked;
create policy "Users can insert own unlocked achievements"
on public.user_achievement_unlocked
for insert
to authenticated
with check (auth.uid() = user_id);

-- ── Seed-Daten ──

insert into public.achievement (key, category, target)
values
    ('spin_10', 'spin', 10),
    ('spin_50', 'spin', 50),
    ('shop_purchase_1', 'shop_purchase', 1),
    ('coins_total_100', 'coins_total', 100)
on conflict (key) do nothing;

commit;
