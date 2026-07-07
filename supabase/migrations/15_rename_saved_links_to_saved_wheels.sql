--Rename saved_links Table to saved_wheels
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'saved_links')
    and not exists (select 1 from information_schema.tables where table_name = 'saved_wheels') then
    alter table public.saved_links rename to saved_wheels;
  end if;
end $$;