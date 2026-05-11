import { supabaseClient } from './shared/supabase-client.js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RoomSpinResponse, RoomRow } from './shared/types.js';

let activeChannel: RealtimeChannel | null = null;

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

export async function createRoom(): Promise<string> {
  const { roomKey } = await postJson<{ roomKey: string }>('/api/room/create');
  return roomKey;
}

export async function joinRoom(roomKey: string): Promise<string[]> {
  const { players } = await postJson<{ players: string[] }>('/api/room/join', { roomKey });
  return players;
}

export async function spinRoom(roomKey: string): Promise<RoomSpinResponse> {
  return postJson<RoomSpinResponse>('/api/room/spin', { roomKey });
}

export function subscribeToRoom(
  roomKey: string,
  onSpin: (lastSpin: number) => void,
  onPlayersUpdate?: (players: string[]) => void,
): void {
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

        if (onPlayersUpdate && Array.isArray(row.players)) {
          onPlayersUpdate(row.players);
        }

        if (!row.spun_at) return;
        const ageMs = Date.now() - new Date(row.spun_at).getTime();
        if (ageMs > 5000) return;

        onSpin(row.last_spin);
      },
    )
    .subscribe();
}

export function unsubscribeFromRoom(): void {
  if (activeChannel) {
    void supabaseClient.removeChannel(activeChannel);
    activeChannel = null;
  }
}
