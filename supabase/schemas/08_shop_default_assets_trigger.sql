begin;

create or replace function public.seed_default_assets()
returns trigger as $$
begin
    insert into public.asset_ownership (user_id, asset_id)
        select NEW.id, id from public.asset
        where name in ('Quagmire', 'Peter Laugh')
        on conflict do nothing;

    insert into public.asset_selection (user_id, category, asset_id)
        select NEW.id, category, id from public.asset
        where name in ('Quagmire', 'Peter Laugh')
        on conflict do nothing;

    return NEW;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
    after insert on public.profiles
    for each row execute function public.seed_default_assets();

-- Backfill für bereits existierende User
insert into public.asset_ownership (user_id, asset_id)
    select p.id, a.id
    from public.profiles p
    cross join public.asset a
    where a.name in ('Quagmire', 'Peter Laugh')
    on conflict do nothing;

insert into public.asset_selection (user_id, category, asset_id)
    select p.id, a.category, a.id
    from public.profiles p
    cross join public.asset a
    where a.name in ('Quagmire', 'Peter Laugh')
    on conflict do nothing;

commit;
