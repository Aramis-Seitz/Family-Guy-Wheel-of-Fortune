-- =========================================================
-- FILE: supabase/migrations/21_rooms_wheel_reset_and_winner_modal_close.sql
-- PURPOSE: Replace the overloaded last_spin sentinel values (-1, -2) used
--          to signal a wheel reset / winner-modal close with two dedicated
--          timestamp columns. Each column is bumped to now() only when its
--          own event happens, so clients can react to wheel-reset and
--          winner-modal-close independently instead of decoding a shared
--          magic number. last_spin goes back to meaning only "the last
--          spin's rotation value".
-- =========================================================

alter table public.rooms
  add column if not exists wheel_reset_at timestamptz,
  add column if not exists winner_modal_close_at timestamptz;
