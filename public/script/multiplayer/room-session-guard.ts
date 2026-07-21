import { supabaseClient } from '../shared/supabase-client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { leaveRoomOnUnload } from '../api/room-api';

export function initRoomUnloadGuard(getActiveRoomKey: () => string | null): void {
  let cachedToken = '';

  void supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
    cachedToken = session?.access_token ?? '';
  });

  supabaseClient.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    cachedToken = session?.access_token ?? '';
  });

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    const roomKey = getActiveRoomKey();
    if (!roomKey || !cachedToken) return;
    leaveRoomOnUnload(roomKey, cachedToken);
  });
}

async function hasActiveSession(): Promise<boolean> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return Boolean(session);
}

export async function redirectIfNoSession(): Promise<boolean> {
  if (await hasActiveSession()) return false;
  window.location.href = "/login.html";
  return true;
}
