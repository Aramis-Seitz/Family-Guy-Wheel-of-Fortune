-- =========================================================
-- FILE: supabase/schemas/06_shop_seed_assets.sql
-- PURPOSE: Initial shop asset seed data
-- STATUS: Already executed in Supabase SQL Editor
-- NOTE: Currently stored in repo for transparency and manual reuse
-- =========================================================

begin;

insert into public.asset (
    id,
    name,
    category,
    price_coins,
    asset_url
)
values
    ('11111111-1111-1111-1111-111111111101', 'Funny Sound Effects', 'sound', 50, '/assets/sounds/funny-sound-effects.mp3'),
    ('11111111-1111-1111-1111-111111111102', 'Stewie', 'companion', 100, '/assets/companions/stewie.png'),
    ('11111111-1111-1111-1111-111111111103', 'Brian', 'companion', 70, '/assets/companions/brian.png'),
    ('11111111-1111-1111-1111-111111111104', 'Quagmire', 'companion', 80, '/assets/companions/quagmire.png'),
    ('11111111-1111-1111-1111-111111111105', 'Peter Laugh', 'sound', 30, '/assets/sounds/peter-laugh.mp3'),
    ('11111111-1111-1111-1111-111111111106', 'Meg Whine', 'sound', 60, '/assets/sounds/meg-whine.mp3'),
    ('11111111-1111-1111-1111-111111111107', 'Chris Goofy', 'sound', 40, '/assets/sounds/chris-goofy.mp3'),
    ('11111111-1111-1111-1111-111111111108', 'Lois Scold', 'sound', 45, '/assets/sounds/lois-scold.mp3'),
    ('11111111-1111-1111-1111-111111111109', 'Cleveland', 'companion', 90, '/assets/companions/cleveland.png'),
    ('11111111-1111-1111-1111-111111111110', 'Joe', 'companion', 85, '/assets/companions/joe.png');

commit;