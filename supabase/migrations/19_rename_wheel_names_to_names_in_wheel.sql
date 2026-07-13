-- Rename wheel_names column to names_in_wheel in rooms table
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'wheel_names')
    and not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'names_in_wheel') then
    alter table public.rooms rename column wheel_names to names_in_wheel;
  end if;
end $$;
