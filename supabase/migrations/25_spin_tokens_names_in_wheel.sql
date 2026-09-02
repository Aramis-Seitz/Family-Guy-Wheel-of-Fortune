-- =========================================================
-- FILE: supabase/migrations/25_spin_tokens_names_in_wheel.sql
-- PURPOSE: Store the resolved wheel line-up on the spin token, so awarding
--          coins no longer depends on a username the client sends back.
--          Same column name as rooms.names_in_wheel, but each entry carries
--          the resolved account: { "username": text, "userId": uuid | null },
--          in the index order of the wheel at the moment the spin was
--          generated. userId = null marks a name that was typed into the
--          names-in-wheel list by hand and belongs to no account -> never
--          receives coins.
-- =========================================================

alter table public.spin_tokens
    add column if not exists names_in_wheel jsonb not null default '[]'::jsonb;
