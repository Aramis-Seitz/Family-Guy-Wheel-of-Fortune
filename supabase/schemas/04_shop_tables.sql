-- =========================================================
-- FILE: supabase/schemas/04_shop_tables.sql
-- PURPOSE: Shop base tables + indexes
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

create table if not exists public.asset (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    price_coins int8 not null,
    asset_url text not null,
    constraint asset_category_valid
        check (category in ('sound', 'companion')),
    constraint asset_price_non_negative
        check (price_coins >= 0),
    constraint asset_id_category_unique
        unique (id, category)
);

create table if not exists public.asset_ownership (
    user_id uuid not null references public.profiles(id) on delete cascade,
    asset_id uuid not null references public.asset(id) on delete cascade,
    primary key (user_id, asset_id)
);

create table if not exists public.asset_selection (
    user_id uuid not null references public.profiles(id) on delete cascade,
    category text not null,
    asset_id uuid not null,
    primary key (user_id, category),
    constraint asset_selection_category_valid
        check (category in ('sound', 'companion')),
    constraint asset_selection_asset_category_fk
        foreign key (asset_id, category)
        references public.asset(id, category)
        on delete cascade
);

create index if not exists asset_ownership_asset_id_idx
    on public.asset_ownership (asset_id);

create index if not exists asset_selection_asset_id_category_idx
    on public.asset_selection (asset_id, category);