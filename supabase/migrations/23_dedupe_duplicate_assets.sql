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

-- Schritt 3: Besitzt ein Nutzer aktuell ein Duplikat (asset_ownership),
-- soll er stattdessen die behaltene id besitzen. Besitzt er die behaltene
-- id bereits, wird hier nichts geändert (sonst gäbe es zwei Einträge für
-- denselben Nutzer + dieselbe id, was die Primary Key verbietet).
update public.asset_ownership
set asset_id = (
    select keep_id
    from duplicate_asset
    where duplicate_id = asset_ownership.asset_id
)
where asset_id in (select duplicate_id from duplicate_asset)
  and not exists (
      select 1
      from public.asset_ownership already_owned
      where already_owned.user_id = asset_ownership.user_id
        and already_owned.asset_id = (
            select keep_id
            from duplicate_asset
            where duplicate_id = asset_ownership.asset_id
        )
  );

-- Schritt 4: Wer sowohl das Original als auch das Duplikat besaß, konnte in
-- Schritt 3 nicht umgebogen werden (siehe Kommentar oben). Diese übrig
-- gebliebenen Duplikat-Einträge werden jetzt einfach gelöscht.
delete from public.asset_ownership
where asset_id in (select duplicate_id from duplicate_asset);

-- Schritt 5: Genauso bei asset_selection: Duplikat-id durch die behaltene
-- id ersetzen. Hier gibt es kein Konflikt-Risiko, weil die Primary Key von
-- asset_selection (user_id, category) ist, nicht (user_id, asset_id).
update public.asset_selection
set asset_id = (
    select keep_id
    from duplicate_asset
    where duplicate_id = asset_selection.asset_id
)
where asset_id in (select duplicate_id from duplicate_asset);

-- Schritt 6: Jetzt verweist nichts mehr auf die Duplikate. Die doppelten
-- asset-Zeilen können gefahrlos gelöscht werden.
delete from public.asset
where id in (select duplicate_id from duplicate_asset);

commit;
