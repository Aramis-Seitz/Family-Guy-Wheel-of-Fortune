alter table public.profiles
    add column if not exists suffix int not null default 0
    constraint profiles_suffix_two_digits check (suffix between 0 and 99);

-- Einziger Doppelname im Bestand: "jarne". Der zweite Account bekommt 01,
-- damit der unique index in Migration 27 durchlaeuft.
update public.profiles
set suffix = 1
where id = (
    select id from public.profiles
    where lower(username) = 'jarne'
    order by id
    offset 1 limit 1
);