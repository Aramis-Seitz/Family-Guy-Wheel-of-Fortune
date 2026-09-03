-- =========================================================
-- FILE: supabase/migrations/26_achievement_progress_triggers.sql
-- PURPOSE: Verlagert die Achievement-Fortschrittsberechnung von der
--          Anwendungsschicht (spin-service/user-service/shop-service) in
--          die Datenbank. spin_tokens/profiles/asset_ownership lösen die
--          Fortschritts-Updates jetzt selbst per Trigger aus; das Frontend
--          erfährt von Unlocks ausschließlich über die bestehende
--          Realtime-Subscription auf user_achievement_unlocked.
-- =========================================================

begin;

create or replace function public.fn_increment_achievement_progress(
    p_user_id uuid,
    p_category text,
    p_amount int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
    v_new_progress int;
begin
    for r in
        select a.id, a.target
        from public.achievement a
        where a.category = p_category
          and not exists (
              select 1 from public.user_achievement_unlocked u
              where u.user_id = p_user_id and u.achievement_id = a.id
          )
    loop
        insert into public.user_achievement_progress (user_id, achievement_id, progress, updated_at)
        values (p_user_id, r.id, least(p_amount, r.target), now())
        on conflict (user_id, achievement_id)
        do update set
            progress = least(public.user_achievement_progress.progress + p_amount, r.target),
            updated_at = now()
        returning progress into v_new_progress;

        if v_new_progress >= r.target then
            insert into public.user_achievement_unlocked (user_id, achievement_id, unlocked_at)
            values (p_user_id, r.id, now())
            on conflict (user_id, achievement_id) do nothing;
        end if;
    end loop;
end;
$$;

-- ── coins_total: Trigger auf profiles.coins ──

create or replace function public.trg_profiles_coins_achievement() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if NEW.coins > OLD.coins then
        perform public.fn_increment_achievement_progress(NEW.id, 'coins_total', NEW.coins - OLD.coins);
    end if;
    return NEW;
end;
$$;

drop trigger if exists trg_profiles_coins_achievement on public.profiles;
create trigger trg_profiles_coins_achievement
after update on public.profiles
for each row
when (NEW.coins is distinct from OLD.coins)
execute function public.trg_profiles_coins_achievement();

-- ── spin: Trigger auf spin_tokens.used ──

create or replace function public.trg_spin_tokens_achievement() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if NEW.used = true and OLD.used = false then
        perform public.fn_increment_achievement_progress(NEW.user_id, 'spin', 1);
    end if;
    return NEW;
end;
$$;

drop trigger if exists trg_spin_tokens_achievement on public.spin_tokens;
create trigger trg_spin_tokens_achievement
after update on public.spin_tokens
for each row
when (NEW.used is distinct from OLD.used)
execute function public.trg_spin_tokens_achievement();

-- ── shop_purchase: Trigger auf asset_ownership ──

create or replace function public.trg_asset_ownership_achievement() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.fn_increment_achievement_progress(NEW.user_id, 'shop_purchase', 1);
    return NEW;
end;
$$;

drop trigger if exists trg_asset_ownership_achievement on public.asset_ownership;
create trigger trg_asset_ownership_achievement
after insert on public.asset_ownership
for each row
execute function public.trg_asset_ownership_achievement();

commit;
