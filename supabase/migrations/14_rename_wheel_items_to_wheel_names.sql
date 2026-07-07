-- Rename wheel_items column to wheel_names in rooms table
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'wheel_items') then
    alter table public.rooms rename column wheel_items to wheel_names;
  end if;
end $$;
