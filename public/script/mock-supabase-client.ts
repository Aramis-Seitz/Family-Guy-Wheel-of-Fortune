const SESSION_KEY = 'mock_session';

interface MockSession {
  access_token: string;
  user: { id: string; email: string; user_metadata: { username: string } };
}

function loadSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: MockSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function projectRow(row: any, cols: string) {
  if (!cols || cols === '*') return { ...row };
  const result: Record<string, unknown> = {};
  for (const part of cols.split(',').map(s => s.trim())) {
    if (part.includes(':')) {
      const [alias, source] = part.split(':').map(s => s.trim());
      result[alias] = row[source];
    } else {
      result[part] = row[part];
    }
  }
  return result;
}

class MockQueryBuilder {
  private _table: string;
  private _op = '';
  private _selectCols = '*';
  private _insertData: any;
  private _filters: { col: string; val: unknown }[] = [];
  private _orderCol?: string;
  private _orderAsc = true;
  private _limitNum?: number;
  private _single = false;

  constructor(table: string) { this._table = table; }

  select(cols = '*') { this._op = 'select'; this._selectCols = cols; return this; }
  insert(data: any) { this._op = 'insert'; this._insertData = data; return this; }
  update(_data: any) { this._op = 'noop'; return this; }
  delete() { this._op = 'delete'; return this; }
  eq(col: string, val: unknown) { this._filters.push({ col, val }); return this; }
  order(col: string, opts: { ascending?: boolean } = {}) {
    this._orderCol = col;
    this._orderAsc = opts.ascending !== false;
    return this;
  }
  limit(n: number) { this._limitNum = n; return this; }
  single() { this._single = true; return this; }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this._execute().then(resolve, reject);
  }

  private _eqFilter(key: string) {
    return this._filters.find(f => f.col === key)?.val as string | undefined;
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      return await this._run();
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  private async _run(): Promise<{ data: any; error: any }> {
    const t = this._table;
    const cols = this._selectCols;

    if (t === 'profiles') {
      if (this._op === 'select') {
        const id = this._eqFilter('id');
        const username = this._eqFilter('username');

        const url = id
          ? `/api/mock/profile/${id}`
          : username
          ? `/api/mock/profile/by-username/${encodeURIComponent(username)}`
          : null;

        if (!url) return { data: null, error: { message: 'Missing filter for profiles select' } };

        const res = await fetch(url);
        if (!res.ok) return { data: null, error: { message: 'Not found' } };
        const row = projectRow(await res.json(), cols);
        return { data: this._single ? row : [row], error: null };
      }

      if (this._op === 'insert') {
        const data = Array.isArray(this._insertData) ? this._insertData[0] : this._insertData;
        const res = await fetch('/api/mock/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        // 409 = profile already created during signUp – treat as success
        if (res.status === 409) return { data: null, error: null };
        if (!res.ok) return { data: null, error: { message: 'Insert failed' } };
        return { data: await res.json(), error: null };
      }
    }

    if (t === 'saved_links') {
      if (this._op === 'select') {
        const userId = this._eqFilter('user_id');
        if (!userId) return { data: [], error: null };

        const res = await fetch(`/api/mock/saved_links/${userId}`);
        if (!res.ok) return { data: [], error: null };
        const rows: any[] = await res.json();
        const projected = rows.map(r => projectRow(r, cols));
        return { data: projected, error: null };
      }

      if (this._op === 'insert') {
        const data = Array.isArray(this._insertData) ? this._insertData[0] : this._insertData;
        const res = await fetch('/api/mock/saved_links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) return { data: null, error: { message: 'Insert failed' } };
        return { data: await res.json(), error: null };
      }

      if (this._op === 'delete') {
        const id = this._eqFilter('id');
        if (!id) return { data: null, error: { message: 'No id filter for delete' } };
        await fetch(`/api/mock/saved_links/${id}`, { method: 'DELETE' });
        return { data: null, error: null };
      }
    }

    if (this._op === 'noop') return { data: null, error: null };

    return { data: null, error: { message: `Unsupported: ${t}.${this._op}` } };
  }
}

const noopChannel = {
  on(..._args: any[]) { return noopChannel; },
  subscribe() { return noopChannel; },
};

export function createMockClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const res = await fetch('/api/mock/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const body = await res.json();
        if (!res.ok) return { data: null, error: { message: body.error } };
        saveSession({ access_token: body.token, user: body.user });
        return { data: body, error: null };
      },

      async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string } } }) {
        const username = options?.data?.username ?? '';
        const res = await fetch('/api/mock/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        });
        const body = await res.json();
        if (!res.ok) return { data: { user: null }, error: { message: body.error } };
        saveSession({ access_token: body.token, user: body.user });
        return { data: { user: body.user }, error: null };
      },

      async getSession() {
        const session = loadSession();
        return { data: { session }, error: null };
      },

      async getUser() {
        const session = loadSession();
        if (!session) return { data: { user: null }, error: { message: 'No session' } };
        return { data: { user: session.user }, error: null };
      },

      async signOut() {
        clearSession();
        return { error: null };
      },
    },

    from(table: string) {
      return new MockQueryBuilder(table);
    },

    channel(_name: string) {
      return noopChannel;
    },
  };
}
