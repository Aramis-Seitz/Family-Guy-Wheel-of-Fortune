import { supabaseClient } from './shared/supabase-client.js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RoomSpinResponse, RoomRow } from './shared/types.js';

let activeChannel: RealtimeChannel | null = null;
let lastKnownPlayersJson = '';
let lastKnownMultiplier: number | null = null;

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token ?? '';
}

async function postJson<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function createRoom(): Promise<{ roomKey: string; players: string[] }> {
  return postJson<{ roomKey: string; players: string[] }>('/api/room/create');
}

export async function joinRoom(roomKey: string): Promise<{ players: string[]; multiplier: number }> {
  return postJson<{ players: string[]; multiplier: number }>('/api/room/join', { roomKey });
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
  await postJson('/api/room/multiplier', { roomKey, multiplier });
}

export async function spinRoom(roomKey: string, names: string[]): Promise<RoomSpinResponse> {
  return postJson<RoomSpinResponse>('/api/room/spin', { roomKey, names });
}

export async function closeRoom(roomKey: string): Promise<void> {
  await postJson('/api/room/close', { roomKey });
}

export async function resetRoom(roomKey: string): Promise<void> {
  await postJson('/api/room/reset', { roomKey });
}

export function subscribeToRoom(
  roomKey: string,
  onSpin: (lastSpin: number, multiplier: number) => void,
  onPlayersUpdate?: (players: string[]) => void,
  onClose?: () => void,
  onMultiplierUpdate?: (multiplier: number) => void,
  onReset?: () => void,
): void {
  lastKnownPlayersJson = '';
  lastKnownMultiplier = null;

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
        const row = payload.new;

        if (Array.isArray(row.players)) {
          // players = [] signals the host closed the room
          if (row.players.length === 0) {
            onClose?.();
            return;
          }

          // Only call onPlayersUpdate when the player list actually changed (not on spin events)
          const json = JSON.stringify(row.players);
          if (json !== lastKnownPlayersJson) {
            lastKnownPlayersJson = json;
            onPlayersUpdate?.(row.players);
          }
        }

        // Notify when the host changes the multiplier
        const newMultiplier = row.multiplier ?? 1;
        if (newMultiplier !== lastKnownMultiplier) {
          lastKnownMultiplier = newMultiplier;
          onMultiplierUpdate?.(newMultiplier);
        }

        if (!row.spun_at) return;
        const ageMs = Date.now() - new Date(row.spun_at).getTime();
        if (ageMs > 5000) return;

        if (row.last_spin === -1) {
          onReset?.();
          return;
        }

        onSpin(row.last_spin, newMultiplier);
      },
    )
    .subscribe();
}

export function unsubscribeFromRoom(): void {
  if (activeChannel) {
    void supabaseClient.removeChannel(activeChannel);
    activeChannel = null;
  }
  lastKnownPlayersJson = '';
  lastKnownMultiplier = null;
}
