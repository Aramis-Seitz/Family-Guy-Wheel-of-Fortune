begin;

insert into public.asset (name, category, price_coins, asset_url)
select asset.name, asset.category, asset.price_coins, asset.asset_url
from (
    values
        ('Brian', 'companion', 50::int8, '/resources/companions/brian.png'),
        ('Lois', 'companion', 40::int8, '/resources/companions/lois.png'),
        ('Cymbal Crash', 'sound', 10::int8, '/resources/sounds/cymbal-crash.mp3'),
        ('Drumroll', 'sound', 10::int8, '/resources/sounds/drumroll.mp3')
) as asset(name, category, price_coins, asset_url)
where not exists (
    select 1
    from public.asset existing
    where existing.category = asset.category
      and existing.asset_url = asset.asset_url
);

commit;