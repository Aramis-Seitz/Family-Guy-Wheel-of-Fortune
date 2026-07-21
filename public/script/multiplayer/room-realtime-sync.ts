import { supabaseClient } from '../shared/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RoomPlayer {
  username: string;
}

interface RoomRow {
  last_spin: number;
  spun_at: string;
  players: RoomPlayer[];
  names_in_wheel?: string[];
  multiplier: number;
  spin_direction: string | null;
  wheel_reset_at?: string | null;
  winner_modal_close_at?: string | null;
}

let activeChannel: RealtimeChannel | null = null;
let lastKnownPlayersJson = '';
let lastKnownNamesInWheelListJson = '';
let lastKnownMultiplier: number | null = null;
let lastKnownWheelResetAt = '';
let lastKnownWinnerModalCloseAt = '';

export function subscribeToRoom(
  roomKey: string,
  onSpin: (extraRotationDegrees: number, multiplier: number, direction: string) => void,
  onPlayersUpdate?: (players: string[]) => void,
  onClose?: () => void,
  onMultiplierUpdate?: (multiplier: number) => void,
  onNamesUpdate?: (names: string[]) => void,
  onWheelReset?: () => void,
  onWinnerModalClose?: () => void,
): void {
  unsubscribeFromRoom();

  activeChannel = supabaseClient
    .channel(`room:${roomKey}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `room_key=eq.${roomKey}`,
      },
      (payload: { new: RoomRow }) => {
        const updatedRoom = payload.new;

        if (Array.isArray(updatedRoom.players)) {
          // players = [] signals the host closed the room
          if (updatedRoom.players.length === 0) {
            onClose?.();
            return;
          }

          // Only call onPlayersUpdate when the player list actually changed (not on spin events)
          const playersJson = JSON.stringify(updatedRoom.players);
          if (playersJson !== lastKnownPlayersJson) {
            lastKnownPlayersJson = playersJson;
            onPlayersUpdate?.(updatedRoom.players.map((player) => player.username));
          }
        }

        if (Array.isArray(updatedRoom.names_in_wheel)) {
          const namesInWheelListJson = JSON.stringify(updatedRoom.names_in_wheel);
          if (namesInWheelListJson !== lastKnownNamesInWheelListJson) {
            lastKnownNamesInWheelListJson = namesInWheelListJson;
            onNamesUpdate?.(updatedRoom.names_in_wheel);
          }
        }

        // Notify when the host changes the multiplier
        const newMultiplier = updatedRoom.multiplier ?? 1;
        if (newMultiplier !== lastKnownMultiplier) {
          lastKnownMultiplier = newMultiplier;
          onMultiplierUpdate?.(newMultiplier);
        }

        // Jede Spalte trägt genau ein Ereignis und wird unabhängig von den anderen ausgewertet.
        // Ein Reset-Write fasst last_spin/spun_at nie an — ein solches Update darf also nie
        // als Spin interpretiert werden, sonst spielen Gäste die Rad-Animation erneut ab.
        let resetEventHandled = false;

        if (updatedRoom.wheel_reset_at && updatedRoom.wheel_reset_at !== lastKnownWheelResetAt) {
          lastKnownWheelResetAt = updatedRoom.wheel_reset_at;
          onWheelReset?.();
          resetEventHandled = true;
        }

        if (updatedRoom.winner_modal_close_at && updatedRoom.winner_modal_close_at !== lastKnownWinnerModalCloseAt) {
          lastKnownWinnerModalCloseAt = updatedRoom.winner_modal_close_at;
          onWinnerModalClose?.();
          resetEventHandled = true;
        }

        if (resetEventHandled) return;

        if (!updatedRoom.spun_at) return;
        const ageMs = Date.now() - new Date(updatedRoom.spun_at).getTime();
        if (ageMs > 5000) return;

        onSpin(updatedRoom.last_spin, newMultiplier, updatedRoom.spin_direction ?? 'right');

      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'rooms',
        filter: `room_key=eq.${roomKey}`,
      },
      // Host-Leave löscht die Zeile direkt nach dem players=[]-Update; das DELETE
      // ist das verlässliche, endgültige Signal und braucht kein Racing gegen das UPDATE.
      () => { onClose?.(); },
    )
    .subscribe();
}

export function unsubscribeFromRoom(): void {
  if (activeChannel) {
    void supabaseClient.removeChannel(activeChannel);
    activeChannel = null;
  }
  lastKnownPlayersJson = '';
  lastKnownNamesInWheelListJson = '';
  lastKnownMultiplier = null;
  lastKnownWheelResetAt = '';
  lastKnownWinnerModalCloseAt = '';
}
