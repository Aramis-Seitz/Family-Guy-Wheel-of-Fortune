import { decodeMockJwt } from './mock-routes';
import { store, findProfile, createSpinToken } from './mock-store';

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
  private _insertData: any;
  private _updateData: any;
  private _filters: { col: string; val: unknown }[] = [];
  private _single = false;

  constructor(table: string) { this._table = table; }

  select(cols = '*') {
    if (this._op === 'insert') {
      this._afterInsertSelect = cols;
    } else {
      this._op = 'select';
      this._selectCols = cols;
    }
    return this;
  }

  insert(data: any) { this._op = 'insert'; this._insertData = data; return this; }
  update(data: any) { this._op = 'update'; this._updateData = data; return this; }
  delete() { this._op = 'delete'; return this; }
  eq(col: string, val: unknown) { this._filters.push({ col, val }); return this; }
  single() { this._single = true; return this; }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return Promise.resolve(this._run()).then(resolve, reject);
  }

  private _match(row: any) {
    return this._filters.every(f => row[f.col] === f.val);
  }

  private _run(): { data: any; error: any } {
    const t = this._table;

    if (t === 'profiles') {
      if (this._op === 'select') {
        const rows = store.profiles.filter(r => this._match(r));
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
          data: { user: { id: decoded.id, email: decoded.email, user_metadata: { username: decoded.username } } },
          error: null,
        };
      },
    },
    from(table: string) {
      return new MockQueryBuilder(table);
    },
  };
}
