import { apiUrl } from './shared/api-base';

// Ersetzt den echten Supabase-JS-Client im Mock-Modus (VITE_USE_MOCK=true).
// Seit der Backend-Refactorierung läuft der komplette Datenzugriff
// (Profile, Coins, Rooms, Shop, Inventory, Spins) über die REST-API unter
// /api/* — dieser Mock muss deshalb nur noch nachbilden, was das Frontend
// tatsächlich direkt am Supabase-Client aufruft: Auth und Realtime.

const SESSION_KEY = 'mock_session';

interface MockUser {
  id: string;
  email: string;
  user_metadata: { username: string; date_of_birth?: string | null };
}

interface MockSession {
  access_token: string;
  user: MockUser;
}

function loadSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: MockSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

type AuthListener = (event: string, session: MockSession | null) => void;
const authListeners = new Set<AuthListener>();

function notifyAuthListeners(event: string, session: MockSession | null): void {
  authListeners.forEach((cb) => cb(event, session));
}

// --- Realtime -------------------------------------------------------
// Es gibt kein echtes WebSocket-Realtime im Mock. Jeder Channel pollt
// stattdessen den passenden /api/mock/realtime/* Endpoint und übersetzt
// Änderungen in dieselben postgres_changes/broadcast-Events, die
// room-realtime-sync.ts und room-chat.ts von der echten Supabase-Realtime
// erwarten. Funktioniert über mehrere Tabs/Browser hinweg, weil der
// Node-Server als gemeinsamer Zustand dient.

const POLL_INTERVAL_MS = 700;

type PgHandler = { event: string; callback: (payload: { new: unknown }) => void };
type BroadcastHandler = { event: string; callback: (msg: { payload: unknown }) => void };
interface ChatMessage { seq: number; event: string; payload: unknown }

class MockChannel {
  private name: string;
  private pgHandlers: PgHandler[] = [];
  private broadcastHandlers: BroadcastHandler[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private lastRoomSnapshot: string | null = null;
  private lastChatSeq = 0;

  constructor(name: string) {
    this.name = name;
  }

  on(type: string, filter: { event: string }, callback: (arg: never) => void): this {
    if (type === 'postgres_changes') this.pgHandlers.push({ event: filter.event, callback: callback as PgHandler['callback'] });
    if (type === 'broadcast') this.broadcastHandlers.push({ event: filter.event, callback: callback as BroadcastHandler['callback'] });
    return this;
  }

  subscribe(): this {
    if (this.name.startsWith('room:')) this.pollRoom(this.name.slice('room:'.length));
    if (this.name.startsWith('chat:')) this.pollChat(this.name.slice('chat:'.length));
    return this;
  }

  async send(msg: { type: string; event: string; payload: unknown }): Promise<'ok'> {
    if (msg.type === 'broadcast' && this.name.startsWith('chat:')) {
      const roomKey = this.name.slice('chat:'.length);
      await fetch(apiUrl(`/api/mock/realtime/chat/${roomKey}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: msg.event, payload: msg.payload }),
      });
    }
    return 'ok';
  }

  close(): void {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(fn: () => void): void {
    if (this.closed) return;
    this.timer = setTimeout(fn, POLL_INTERVAL_MS);
  }

  private pollRoom(roomKey: string): void {
    const tick = async (): Promise<void> => {
      if (this.closed) return;
      try {
        const res = await fetch(apiUrl(`/api/mock/realtime/rooms/${roomKey}`));
        if (res.status === 404) {
          if (this.lastRoomSnapshot !== null) {
            this.lastRoomSnapshot = null;
            this.emitPg('DELETE', null);
          }
        } else if (res.ok) {
          const row = await res.json();
          const snapshot = JSON.stringify(row);
          if (snapshot !== this.lastRoomSnapshot) {
            this.lastRoomSnapshot = snapshot;
            this.emitPg('UPDATE', row);
          }
        }
      } catch {
        // Netzwerkfehler ignorieren — der nächste Poll versucht es erneut.
      }
      this.schedule(() => void tick());
    };
    void tick();
  }

  private pollChat(roomKey: string): void {
    const tick = async (): Promise<void> => {
      if (this.closed) return;
      try {
        const res = await fetch(apiUrl(`/api/mock/realtime/chat/${roomKey}?since=${this.lastChatSeq}`));
        if (res.ok) {
          const messages: ChatMessage[] = await res.json();
          for (const msg of messages) {
            this.lastChatSeq = Math.max(this.lastChatSeq, msg.seq);
            this.broadcastHandlers
              .filter((h) => h.event === msg.event)
              .forEach((h) => h.callback({ payload: msg.payload }));
          }
        }
      } catch {
        // Netzwerkfehler ignorieren — der nächste Poll versucht es erneut.
      }
      this.schedule(() => void tick());
    };
    void tick();
  }

  private emitPg(event: 'UPDATE' | 'DELETE', row: unknown): void {
    this.pgHandlers.filter((h) => h.event === event).forEach((h) => h.callback({ new: row }));
  }
}

export function createMockClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const res = await fetch(apiUrl('/api/mock/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const body = await res.json();
        if (!res.ok) return { data: null, error: { message: body.error } };
        const session: MockSession = { access_token: body.token, user: body.user };
        saveSession(session);
        notifyAuthListeners('SIGNED_IN', session);
        return { data: { user: body.user, session }, error: null };
      },

      async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string; date_of_birth?: string } } }) {
        const username = options?.data?.username ?? '';
        const date_of_birth = options?.data?.date_of_birth ?? null;
        const res = await fetch(apiUrl('/api/mock/auth/signup'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, date_of_birth }),
        });
        const body = await res.json();
        if (!res.ok) return { data: { user: null, session: null }, error: { message: body.error } };
        const session: MockSession = { access_token: body.token, user: body.user };
        saveSession(session);
        notifyAuthListeners('SIGNED_IN', session);
        return { data: { user: body.user, session }, error: null };
      },

      async getSession() {
        return { data: { session: loadSession() }, error: null };
      },

      async getUser() {
        const session = loadSession();
        if (!session) return { data: { user: null }, error: { message: 'No session' } };
        return { data: { user: session.user }, error: null };
      },

      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback);
        // Supabase ruft den Callback direkt nach der Registrierung einmal
        // mit dem aktuellen Stand auf ("INITIAL_SESSION").
        callback('INITIAL_SESSION', loadSession());
        return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
      },

      async signOut() {
        clearSession();
        notifyAuthListeners('SIGNED_OUT', null);
        return { error: null };
      },
    },

    channel(name: string) {
      return new MockChannel(name);
    },

    async removeChannel(channel: MockChannel) {
      channel.close();
      return 'ok';
    },
  };
}
