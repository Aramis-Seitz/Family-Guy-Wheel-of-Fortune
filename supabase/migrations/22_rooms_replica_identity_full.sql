-- =========================================================
-- FILE: supabase/migrations/22_rooms_replica_identity_full.sql
-- PURPOSE: DELETE-Events auf public.rooms enthalten per Default nur die
--          Primary-Key-Spalte (id) im "old record". Damit Realtime-Clients
--          DELETEs per room_key filtern können (z.B. um zuverlässig zu
--          erkennen, dass der Host den Room geschlossen hat), muss die
--          Tabelle die vollständige alte Zeile in die WAL schreiben.
-- =========================================================

alter table public.rooms replica identity full;
