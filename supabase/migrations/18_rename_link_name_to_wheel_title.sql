-- Rename link_name column to wheel_title in saved_wheels table
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'saved_wheels' and column_name = 'link_name')
    and not exists (select 1 from information_schema.columns where table_name = 'saved_wheels' and column_name = 'wheel_title') then
    alter table public.saved_wheels rename column link_name to wheel_title;
  end if;
end $$;
