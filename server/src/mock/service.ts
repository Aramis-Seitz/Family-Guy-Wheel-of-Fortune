import { decodeMockJwt } from './routes';
import { store, findProfile, createSpinToken } from './store';

function project(row: any, cols: string) {
  if (!cols || cols === '*') return { ...row };
  const result: Record<string, unknown> = {};
  for (const part of cols.split(',').map(s => s.trim())) {
    result[part] = row[part];
  }
  return result;
}

class MockQueryBuilder {
  private _table: string;
  private _op = '';
  private _selectCols = '*';
  private _afterInsertSelect = '';
  private _afterMutationSelect = '';
  private _insertData: any;
  private _updateData: any;
  private _filters: { col: string; val: unknown }[] = [];
  private _single = false;
  private _orderCol?: string;
  private _orderAsc = true;
  private _limitNum?: number;
  private _containsPlayerId?: string;
  private _maybeSingle = false;

  constructor(table: string) { this._table = table; }

  select(cols = '*') {
    if (this._op === 'insert') {
      this._afterInsertSelect = cols;
    } else if (this._op === 'update') {
      this._afterMutationSelect = cols;
    } else {
      this._op = 'select';
      this._selectCols = cols;
    }
    return this;
  }

  insert(data: any) { this._op = 'insert'; this._insertData = data; return this; }
  update(data: any) { this._op = 'update'; this._updateData = data; return this; }
  delete() { this._op = 'delete'; return this; }
  upsert(data: any) { this._op = 'upsert'; this._insertData = data; return this; }
  eq(col: string, val: unknown) { this._filters.push({ col, val }); return this; }
  filter(col: string, operator: string, value: string) {
    if (col === 'players' && operator === 'cs') {
      const players = JSON.parse(value) as Array<{ id?: string }>;
      this._containsPlayerId = players[0]?.id;
    }
    return this;
  }
  in(col: string, values: unknown[]) { this._filters.push({ col, val: values }); return this; }
  order(col: string, opts: { ascending?: boolean } = {}) { this._orderCol = col; this._orderAsc = opts.ascending !== false; return this; }
  limit(n: number) { this._limitNum = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; this._maybeSingle = true; return this; }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return Promise.resolve(this._run()).then(resolve, reject);
  }

  private _match(row: any) {
    return this._filters.every(f => Array.isArray(f.val) ? f.val.includes(row[f.col]) : row[f.col] === f.val);
  }

  private _rows(rows: any[]) {
    let result = rows.filter(r => this._match(r));
    if (this._containsPlayerId) {
      const userId = this._containsPlayerId;
      result = result.filter(row => Array.isArray(row.players) && row.players.some((player: { id?: string }) => player.id === userId));
    }
    if (this._orderCol) {
      const col = this._orderCol;
      result = [...result].sort((a, b) => String(a[col]).localeCompare(String(b[col])) * (this._orderAsc ? 1 : -1));
    }
    return this._limitNum === undefined ? result : result.slice(0, this._limitNum);
  }

  private _run(): { data: any; error: any } {
    const t = this._table;

    if (t === 'profiles') {
      if (this._op === 'select') {
        const rows = this._rows(store.profiles);
        if (this._single) {
          return rows.length > 0
            ? { data: project(rows[0], this._selectCols), error: null }
            : { data: null, error: { message: 'Row not found' } };
        }
        return { data: rows.map(r => project(r, this._selectCols)), error: null };
      }

      if (this._op === 'update') {
        store.profiles.filter(r => this._match(r)).forEach(r => Object.assign(r, this._updateData));
        return { data: null, error: null };
      }

      if (this._op === 'insert') {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        store.profiles.push(...rows.map(row => ({ coins: 0, password: '', date_of_birth: null, ...row })));
        return { data: null, error: null };
      }
    }

    if (t === 'asset') {
      if (this._op === 'select') {
        const rows = this._rows(store.assets);
        if (this._single) return rows.length ? { data: project(rows[0], this._selectCols), error: null } : { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
        return { data: rows.map(row => project(row, this._selectCols)), error: null };
      }
    }

    if (t === 'asset_ownership') {
      if (this._op === 'select') {
        const rows = this._rows(store.asset_ownership).map(row => {
          if (this._selectCols.startsWith('asset:')) return { asset: store.assets.find(asset => asset.id === row.asset_id) ?? null };
          return project(row, this._selectCols);
        });
        if (this._single) return rows.length ? { data: rows[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
        return { data: rows, error: null };
      }
      if (this._op === 'insert' || this._op === 'upsert') {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        for (const row of rows) if (!store.asset_ownership.some(item => item.user_id === row.user_id && item.asset_id === row.asset_id)) store.asset_ownership.push(row);
        return { data: null, error: null };
      }
    }

    if (t === 'asset_selection') {
      if (this._op === 'select') {
        const rows = this._rows(store.asset_selection);
        if (this._single) return rows.length ? { data: project(rows[0], this._selectCols), error: null } : { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
        return { data: rows.map(row => project(row, this._selectCols)), error: null };
      }
      if (this._op === 'upsert') {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        for (const row of rows) {
          const index = store.asset_selection.findIndex(item => item.user_id === row.user_id && item.category === row.category);
          if (index >= 0) store.asset_selection[index] = row;
          else store.asset_selection.push(row);
        }
        return { data: null, error: null };
      }
    }

    if (t === 'saved_wheels') {
      if (this._op === 'select') {
        const rows = this._rows(store.saved_wheels).map(row => ({ id: row.id, title: row.wheel_title, link: row.url, created_at: row.created_at }));
        return { data: rows, error: null };
      }
      if (this._op === 'insert') {
        const row = Array.isArray(this._insertData) ? this._insertData[0] : this._insertData;
        store.saved_wheels.push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row });
        return { data: null, error: null };
      }
      if (this._op === 'delete') {
        store.saved_wheels = store.saved_wheels.filter(row => !this._match(row));
        return { data: null, error: null };
      }
    }

    if (t === 'rooms') {
      if (this._op === 'select') {
        const rows = this._rows(store.rooms);
        if (this._single) {
          if (rows.length) return { data: project(rows[0], this._selectCols), error: null };
          return this._maybeSingle
            ? { data: null, error: null }
            : { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
        }
        return { data: rows.map(row => project(row, this._selectCols)), error: null };
      }
      if (this._op === 'insert') {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        for (const row of rows) {
          store.rooms.push({
            id: crypto.randomUUID(),
            last_spin: null,
            spun_at: null,
            multiplier: 1,
            spin_direction: null,
            ...row,
          });
        }
        return { data: null, error: null };
      }
      if (this._op === 'update') {
        const rows = this._rows(store.rooms);
        rows.forEach(row => Object.assign(row, this._updateData));
        if (this._afterMutationSelect) {
          const projected = rows.map(row => project(row, this._afterMutationSelect));
          return { data: this._single ? (projected[0] ?? null) : projected, error: null };
        }
        return { data: null, error: null };
      }
    }

    if (t === 'spin_tokens') {
      if (this._op === 'insert') {
        const data = Array.isArray(this._insertData) ? this._insertData[0] : this._insertData;
        const token = createSpinToken(data.user_id);
        if (this._afterInsertSelect) {
          const projected = project(token, this._afterInsertSelect);
          return { data: this._single ? projected : [projected], error: null };
        }
        return { data: token, error: null };
      }

      if (this._op === 'select') {
        const rows = store.spin_tokens.filter(r => this._match(r));
        if (this._single) {
          return rows.length > 0
            ? { data: project(rows[0], this._selectCols), error: null }
            : { data: null, error: { message: 'Row not found' } };
        }
        return { data: rows.map(r => project(r, this._selectCols)), error: null };
      }

      if (this._op === 'update') {
        store.spin_tokens.filter(r => this._match(r)).forEach(r => Object.assign(r, this._updateData));
        return { data: null, error: null };
      }
    }

    return { data: null, error: { message: `Unsupported: ${t}.${this._op}` } };
  }
}

export function createMockServiceClient() {
  return {
    auth: {
      async getUser(jwt: string) {
        const decoded = decodeMockJwt(jwt);
        if (!decoded) return { data: { user: null }, error: { message: 'Invalid mock token' } };
        const profile = findProfile(decoded.id);
        if (!profile) return { data: { user: null }, error: { message: 'User not found' } };
        return {
          data: { user: { id: decoded.id, email: decoded.email, user_metadata: { username: decoded.username, date_of_birth: profile.date_of_birth } } },
          error: null,
        };
      },
    },
    from(table: string) {
      return new MockQueryBuilder(table);
    },
  };
}
