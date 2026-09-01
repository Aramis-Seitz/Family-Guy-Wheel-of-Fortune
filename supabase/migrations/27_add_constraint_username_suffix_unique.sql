create unique index if not exists profiles_username_suffix_unique
    on public.profiles (lower(username), suffix);