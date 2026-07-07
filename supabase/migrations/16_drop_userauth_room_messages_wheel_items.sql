-- Drop unused tables userauth and room_messages, and the stale wheel_items column on rooms
drop table if exists public.userauth;
drop table if exists public.room_messages;

alter table public.rooms
    drop column if exists wheel_items;
