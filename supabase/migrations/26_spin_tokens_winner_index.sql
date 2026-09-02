alter table public.spin_tokens
    add column if not exists winner_index integer;

alter table public.rooms
    add column if not exists spin_winner text;
