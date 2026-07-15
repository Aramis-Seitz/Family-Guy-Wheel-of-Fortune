delete from public.rooms
where players = '[]'::jsonb or created_at < current_date;