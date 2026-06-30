import { supabaseClient } from './shared/supabase-client.js';
import type { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { RoomSpinResponse, RoomRow } from './shared/types.js';

let activeChannel: RealtimeChannel | null = null;
let lastKnownPlayersJson = '';
let lastKnownMultiplier: number | null = null;

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token ?? '';
}

async function postJson<T>(path: string, body?: Record<string, unknown>, options: { token?: string; keepalive?: boolean } = {}): Promise<T> {
  const token = options.token ?? await getAccessToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    keepalive: options.keepalive,
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

export async function joinRoom(roomKey: string): Promise<{ players: string[]; multiplier: number; hostName: string }> {
  return postJson<{ players: string[]; multiplier: number; hostName: string }>('/api/room/join', { roomKey });
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
  await postJson('/api/room/multiplier', { roomKey, multiplier });
}

export async function spinRoom(roomKey: string, names: string[], direction: string): Promise<RoomSpinResponse> {
  return postJson<RoomSpinResponse>('/api/room/spin', { roomKey, names, direction });
}

export async function leaveRoom(roomKey: string): Promise<void> {
  await postJson('/api/room/leave', { roomKey });
}

function leaveRoomOnUnload(roomKey: string, token: string): void {
  void postJson('/api/room/leave', { roomKey }, { token, keepalive: true });
}

export async function closeRoom(roomKey: string): Promise<void> {
  await postJson('/api/room/close', { roomKey });
}

export async function resetRoom(roomKey: string): Promise<void> {
  await postJson('/api/room/reset', { roomKey });
}

export function subscribeToRoom(
  roomKey: string,
  onSpin: (lastSpin: number, multiplier: number, direction: string) => void,
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
            onPlayersUpdate?.(row.players.map((p) => p.username));
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
        
        onSpin(row.last_spin, newMultiplier, row.spin_direction ?? 'right');

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

export function initRoomUnloadGuard(getActiveRoomKey: () => string | null): void {
  let cachedToken = '';

  void supabaseClient.auth.getSession().then((result: { data: { session: Session | null } }) => {
    cachedToken = result.data.session?.access_token ?? '';
  });

  supabaseClient.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    cachedToken = session?.access_token ?? '';
  });

  window.addEventListener('beforeunload', () => {
    const roomKey = getActiveRoomKey();
    if (!roomKey || !cachedToken) return;
    leaveRoomOnUnload(roomKey, cachedToken);
  });
}
