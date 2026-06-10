begin;

insert into public.asset (
    name,
    category,
    price_coins,
    asset_url
)
values
    ('Bruh', 'sound', 10, '/assets/sounds/bruh.mp3'),
    ('Cleveland', 'companion', 40, '/assets/companion/cleveland.png'),
    ('Dry Fart', 'sound', 20, '/assets/sounds/dry-fart.mp3'),
    ('Felix', 'companion', 150, '/assets/companions/felix.png'),
    ('Giggity', 'sound', 15, '/assets/sounds/giggity.mp3'),
    ('Joe', 'companion', 45, '/assets/companion/joe.png'),
    ('Meg', 'companion', 40, '/assets/companion/meg.png'),
    ('Michael Jackson', 'sound', 50, '/assets/sounds/michael-jackson-hee-hee.mp3'),
    ('Neee', 'sound', 25, '/assets/sounds/neee.mp3'),
    ('Perfect Fart', 'sound', 25, '/assets/sounds/perfect-fart.mp3'),
    ('Peter', 'companion', 60, '/assets/companions/peter.png'),
    ('Peter Laugh', 'sound', 0, '/assets/sounds/peter-griffin-laugh.mp3'),
    ('Punch', 'sound', 15, '/assets/sounds/punch.mp3'),
    ('Quagmire', 'companion', 0, '/assets/companions/quagmire.png'),
    ('Rizz', 'sound', 20, '/assets/sounds/rizz.mp3'),
    ('Stewie', 'companion', 50, '/assets/companions/stewie.png'),
    ('Super Mario Bros', 'sound', 20, '/assets/sounds/super-mario-bros.mp3'),
    ('Whip', 'sound', 10, '/assets/sounds/whip.mp3');

commit;