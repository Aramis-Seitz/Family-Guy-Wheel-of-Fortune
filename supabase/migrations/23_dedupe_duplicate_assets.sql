-- =========================================================
-- FILE: supabase/migrations/23_dedupe_duplicate_assets.sql
-- PURPOSE: Entfernt doppelte Zeilen in public.asset (gleicher name +
--          category, aber unterschiedliche id). Dadurch tauchte derselbe
--          Companion/Sound mehrfach im Inventar auf.
-- NOTE: Muss vor 24_unique_asset_name_category.sql laufen, denn die dortige
--       UNIQUE-Constraint würde sonst wegen der noch vorhandenen Duplikate
--       fehlschlagen.
-- =========================================================

begin;

-- Schritt 1: Für jede Kombination aus name + category die kleinste id
-- merken. Diese Zeile behalten wir ("keep_id"). Es gibt keine created_at
-- Spalte, daher ist "kleinste id" einfach eine feste, nachvollziehbare Regel.
-- Hinweis: min()/max() gibt es in Postgres nicht direkt für den Typ uuid,
-- deshalb wird hier als text sortiert und danach zurück zu uuid gecastet.
create temporary table keep_asset on commit drop as
select name, category, min(id::text)::uuid as keep_id
from public.asset
group by name, category;

-- Schritt 2: Alle asset-ids auflisten, die NICHT die zu behaltende id sind.
-- Das sind die Duplikate, die am Ende gelöscht werden.
create temporary table duplicate_asset on commit drop as
select a.id as duplicate_id, k.keep_id
from public.asset a
inner join keep_asset k
    on a.name = k.name
    and a.category = k.category
where a.id != k.keep_id;

-- Schritt 3: Auswählen, welche Ownership-Zeile pro Nutzer + zu behaltender
-- id umgebogen werden soll. Wichtig: Ein Nutzer kann mehrere verschiedene
-- Duplikate derselben Gruppe besitzen (z. B. besitzt er sowohl Duplikat B
-- als auch Duplikat C, beides Kopien von A). Ein einzelnes UPDATE würde
-- beide Zeilen unabhängig voneinander auf asset_id = A setzen (die
-- NOT-EXISTS-Prüfung sieht nur den Stand vor dem Statement, nicht die
-- Änderung der jeweils anderen Zeile) und damit zweimal (user_id, A)
-- erzeugen -> Verstoß gegen die Primary Key (user_id, asset_id). Deshalb
-- wird hier per DISTINCT ON vorab genau eine Zeile pro (user_id, keep_id)
-- ausgewählt. Nutzer, die die behaltene id schon besitzen, werden
-- ausgeschlossen (sonst gäbe es ebenfalls einen Konflikt).
create temporary table ownership_to_update on commit drop as
select distinct on (ao.user_id, m.keep_id)
    ao.user_id,
    ao.asset_id as old_asset_id,
    m.keep_id
from public.asset_ownership ao
inner join duplicate_asset m on m.duplicate_id = ao.asset_id
where not exists (
    select 1
    from public.asset_ownership already_owned
    where already_owned.user_id = ao.user_id
      and already_owned.asset_id = m.keep_id
)
order by ao.user_id, m.keep_id, ao.asset_id;

-- Schritt 4: Genau eine Duplikat-Zeile pro Nutzer + Gruppe auf die
-- behaltene id umbiegen (siehe Auswahl aus Schritt 3).
update public.asset_ownership ao
set asset_id = u.keep_id
from ownership_to_update u
where ao.user_id = u.user_id
  and ao.asset_id = u.old_asset_id;

-- Schritt 5: Alle übrig gebliebenen Ownership-Zeilen, die noch auf ein
-- Duplikat zeigen, werden jetzt gelöscht. Das betrifft Fälle, in denen der
-- Nutzer die behaltene id bereits besaß, oder zusätzliche Duplikate
-- desselben Nutzers, die in Schritt 3 nicht ausgewählt wurden.
delete from public.asset_ownership
where asset_id in (select duplicate_id from duplicate_asset);

-- Schritt 6: Genauso bei asset_selection: Duplikat-id durch die behaltene
-- id ersetzen. Hier gibt es kein Konflikt-Risiko, weil die Primary Key von
-- asset_selection (user_id, category) ist, nicht (user_id, asset_id) - pro
-- Nutzer + category kann also ohnehin nur eine Zeile existieren.
update public.asset_selection
set asset_id = (
    select keep_id
    from duplicate_asset
    where duplicate_id = asset_selection.asset_id
)
where asset_id in (select duplicate_id from duplicate_asset);

-- Schritt 7: Jetzt verweist nichts mehr auf die Duplikate. Die doppelten
-- asset-Zeilen können gefahrlos gelöscht werden.
delete from public.asset
where id in (select duplicate_id from duplicate_asset);

commit;
