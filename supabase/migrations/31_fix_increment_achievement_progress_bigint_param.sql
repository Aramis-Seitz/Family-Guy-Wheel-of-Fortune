begin;

create or replace function public.fn_increment_achievement_progress(
    p_user_id uuid,
    p_category text,
    p_amount bigint
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

commit;
