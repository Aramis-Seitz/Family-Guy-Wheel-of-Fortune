-- Update asset_url values from the old "/assets/..." path to the new "/resources/..." path
update public.asset
set asset_url = '/resources/' || substring(asset_url from length('/assets/') + 1)
where asset_url like '/assets/%';
