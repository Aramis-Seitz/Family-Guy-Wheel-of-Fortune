-- Backfills default sound ("Peter Laugh") and companion ("Quagmire") for all existing users
-- who were registered before asset ownership/selection was introduced.
-- Safe to re-run: both inserts are guarded by NOT EXISTS.

INSERT INTO asset_ownership (user_id, asset_id)
SELECT p.id, a.id
FROM profiles p
CROSS JOIN asset a
WHERE a.name IN ('Peter Laugh', 'Quagmire')
  AND NOT EXISTS (
    SELECT 1 FROM asset_ownership ao
    WHERE ao.user_id = p.id AND ao.asset_id = a.id
  );

INSERT INTO asset_selection (user_id, category, asset_id)
SELECT p.id, a.category, a.id
FROM profiles p
CROSS JOIN asset a
WHERE a.name IN ('Peter Laugh', 'Quagmire')
  AND NOT EXISTS (
    SELECT 1 FROM asset_selection sel
    WHERE sel.user_id = p.id AND sel.category = a.category
  );
