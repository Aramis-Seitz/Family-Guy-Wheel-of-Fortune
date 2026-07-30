import { store, newId, type Player } from "./store";
import { decodeMockJwt } from "./jwt";

// Emuliert genau die Teilmenge der supabase-js/PostgREST-Query-API, die die
// echten Repositories in server/src/repositories/*.ts benutzen. Kein
// allgemeiner SQL-Interpreter — jede Tabelle wird explizit behandelt, weil
// jede ihre eigenen Spalten/Joins/Upsert-Konflikte hat.

type PostgrestResult<T = unknown> = { data: T | null; error: { message: string; code?: string } | null };

function project(row: object, cols: string): Record<string, unknown> {
    const source = row as Record<string, unknown>;
    if (!cols || cols.trim() === "*") return { ...source };
    const result: Record<string, unknown> = {};
    for (const raw of cols.split(",")) {
        const part = raw.trim();
        if (!part) continue;
        const colonIdx = part.indexOf(":");
        if (colonIdx === -1) {
            result[part] = source[part];
        } else {
            const alias = part.slice(0, colonIdx).trim();
            const key = part.slice(colonIdx + 1).trim();
            result[alias] = source[key];
        }
    }
    return result;
}

function notFoundError() {
    return { message: "Row not found", code: "PGRST116" };
}

function applyOrder<T extends object>(rows: T[], col: string, ascending: boolean): T[] {
    return [...rows].sort((a, b) => {
        const av = (a as Record<string, unknown>)[col] as string | number;
        const bv = (b as Record<string, unknown>)[col] as string | number;
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
    });
}

function matchesContains(columnValue: unknown, jsonVal: string): boolean {
    let needles: unknown;
    try {
        needles = JSON.parse(jsonVal);
    } catch {
        return false;
    }
    if (!Array.isArray(columnValue) || !Array.isArray(needles)) return false;
    return needles.every((needle) =>
        columnValue.some((item) =>
            Object.entries(needle as Record<string, unknown>).every(([k, v]) => (item as Record<string, unknown>)[k] === v)
        )
    );
}

type UpsertOpts = { onConflict?: string; ignoreDuplicates?: boolean };
type Op = "" | "select" | "insert" | "update" | "upsert" | "delete";

class MockQueryBuilder {
    private table: string;
    private op: Op = "";
    private selectCols = "*";
    private returningCols: string | null = null;
    private mutationData: unknown;
    private upsertOpts: UpsertOpts = {};
    private eqFilters: { col: string; val: unknown }[] = [];
    private inFilters: { col: string; vals: unknown[] }[] = [];
    private csFilters: { col: string; val: string }[] = [];
    private orderCol: string | null = null;
    private orderAsc = true;
    private limitNum: number | null = null;
    private wantSingle = false;
    private wantMaybeSingle = false;

    constructor(table: string) {
        this.table = table;
    }

    select(cols = "*") {
        if (this.op === "") {
            this.op = "select";
            this.selectCols = cols;
        } else {
            this.returningCols = cols;
        }
        return this;
    }

    insert(data: unknown) {
        this.op = "insert";
        this.mutationData = data;
        return this;
    }

    update(data: unknown) {
        this.op = "update";
        this.mutationData = data;
        return this;
    }

    upsert(data: unknown, opts: UpsertOpts = {}) {
        this.op = "upsert";
        this.mutationData = data;
        this.upsertOpts = opts;
        return this;
    }

    delete() {
        this.op = "delete";
        return this;
    }

    eq(col: string, val: unknown) {
        this.eqFilters.push({ col, val });
        return this;
    }

    in(col: string, vals: unknown[]) {
        this.inFilters.push({ col, vals });
        return this;
    }

    filter(col: string, op: string, val: unknown) {
        if (op === "cs") this.csFilters.push({ col, val: String(val) });
        return this;
    }

    order(col: string, opts: { ascending?: boolean } = {}) {
        this.orderCol = col;
        this.orderAsc = opts.ascending !== false;
        return this;
    }

    limit(n: number) {
        this.limitNum = n;
        return this;
    }

    single() {
        this.wantSingle = true;
        return this;
    }

    maybeSingle() {
        this.wantMaybeSingle = true;
        return this;
    }

    then(resolve: (v: PostgrestResult) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(this.run()).then(resolve, reject);
    }

    private matches(row: object): boolean {
        const r = row as Record<string, unknown>;
        if (!this.eqFilters.every((f) => r[f.col] === f.val)) return false;
        if (!this.inFilters.every((f) => f.vals.includes(r[f.col]))) return false;
        if (!this.csFilters.every((f) => matchesContains(r[f.col], f.val))) return false;
        return true;
    }

    private selectRows<T extends object>(rows: T[]): PostgrestResult {
        let matched = rows.filter((r) => this.matches(r));
        if (this.orderCol) matched = applyOrder(matched, this.orderCol, this.orderAsc);
        if (this.limitNum != null) matched = matched.slice(0, this.limitNum);

        if (this.wantSingle) {
            if (matched.length === 0) return { data: null, error: notFoundError() };
            return { data: project(matched[0], this.selectCols), error: null };
        }
        if (this.wantMaybeSingle) {
            if (matched.length === 0) return { data: null, error: null };
            return { data: project(matched[0], this.selectCols), error: null };
        }
        return { data: matched.map((r) => project(r, this.selectCols)), error: null };
    }

    private mutationResult<T extends object>(rows: T[]): PostgrestResult {
        if (this.returningCols == null) return { data: null, error: null };
        if (this.wantSingle) {
            if (rows.length === 0) return { data: null, error: notFoundError() };
            return { data: project(rows[0], this.returningCols), error: null };
        }
        return { data: rows.map((r) => project(r, this.returningCols as string)), error: null };
    }

    private run(): PostgrestResult {
        switch (this.table) {
            case "profiles":
                return this.runProfiles();
            case "rooms":
                return this.runRooms();
            case "spin_tokens":
                return this.runSpinTokens();
            case "saved_wheels":
                return this.runSavedWheels();
            case "asset":
                return this.runAsset();
            case "asset_ownership":
                return this.runAssetOwnership();
            case "asset_selection":
                return this.runAssetSelection();
            default:
                return { data: null, error: { message: `Mock: unbekannte Tabelle "${this.table}"` } };
        }
    }

    private runProfiles(): PostgrestResult {
        if (this.op === "select") return this.selectRows(store.profiles);

        if (this.op === "insert") {
            const data = (Array.isArray(this.mutationData) ? this.mutationData[0] : this.mutationData) as Partial<
                (typeof store.profiles)[number]
            >;
            if (store.profiles.some((p) => p.id === data.id)) {
                return { data: null, error: { message: "duplicate key value violates unique constraint", code: "23505" } };
            }
            const profile = {
                id: data.id as string,
                username: data.username as string,
                email: data.email as string,
                date_of_birth: data.date_of_birth ?? null,
                coins: data.coins ?? 1,
            };
            store.profiles.push(profile);
            return this.mutationResult([profile]);
        }

        if (this.op === "update") {
            const rows = store.profiles.filter((r) => this.matches(r));
            rows.forEach((r) => Object.assign(r, this.mutationData));
            return this.mutationResult(rows);
        }

        return { data: null, error: { message: `Mock: unsupported profiles.${this.op}` } };
    }

    private runRooms(): PostgrestResult {
        if (this.op === "select") return this.selectRows(store.rooms);

        if (this.op === "insert") {
            const data = (Array.isArray(this.mutationData) ? this.mutationData[0] : this.mutationData) as {
                room_key: string;
                host_id: string;
                players: Player[];
                names_in_wheel?: string[];
            };
            const room = {
                id: newId(),
                room_key: data.room_key,
                host_id: data.host_id,
                players: data.players,
                names_in_wheel: data.names_in_wheel ?? [],
                last_spin: null,
                spun_at: null,
                multiplier: 1,
                spin_direction: null,
                wheel_reset_at: null,
                winner_modal_close_at: null,
                created_at: new Date().toISOString(),
            };
            store.rooms.push(room);
            return this.mutationResult([room]);
        }

        if (this.op === "update") {
            const rows = store.rooms.filter((r) => this.matches(r));
            rows.forEach((r) => Object.assign(r, this.mutationData));
            return this.mutationResult(rows);
        }

        if (this.op === "delete") {
            store.rooms = store.rooms.filter((r) => !this.matches(r));
            return { data: null, error: null };
        }

        return { data: null, error: { message: `Mock: unsupported rooms.${this.op}` } };
    }

    private runSpinTokens(): PostgrestResult {
        if (this.op === "insert") {
            const data = (Array.isArray(this.mutationData) ? this.mutationData[0] : this.mutationData) as {
                token: string;
                user_id: string;
            };
            const token = { token: data.token, user_id: data.user_id, used: false, created_at: new Date().toISOString() };
            store.spin_tokens.push(token);
            return this.mutationResult([token]);
        }

        if (this.op === "select") return this.selectRows(store.spin_tokens);

        if (this.op === "update") {
            const rows = store.spin_tokens.filter((r) => this.matches(r));
            rows.forEach((r) => Object.assign(r, this.mutationData));
            return this.mutationResult(rows);
        }

        return { data: null, error: { message: `Mock: unsupported spin_tokens.${this.op}` } };
    }

    private runSavedWheels(): PostgrestResult {
        if (this.op === "select") return this.selectRows(store.saved_wheels);

        if (this.op === "insert") {
            const data = (Array.isArray(this.mutationData) ? this.mutationData[0] : this.mutationData) as {
                user_id: string;
                wheel_title: string;
                url: string;
            };
            const wheel = { id: newId(), ...data, created_at: new Date().toISOString() };
            store.saved_wheels.push(wheel);
            return this.mutationResult([wheel]);
        }

        if (this.op === "delete") {
            store.saved_wheels = store.saved_wheels.filter((r) => !this.matches(r));
            return { data: null, error: null };
        }

        return { data: null, error: { message: `Mock: unsupported saved_wheels.${this.op}` } };
    }

    private runAsset(): PostgrestResult {
        if (this.op === "select") return this.selectRows(store.asset);
        return { data: null, error: { message: `Mock: unsupported asset.${this.op}` } };
    }

    private runAssetOwnership(): PostgrestResult {
        if (this.op === "select") {
            const joinMatch = /^asset:asset_id\((.*)\)$/s.exec(this.selectCols.trim());
            if (joinMatch) {
                const innerCols = joinMatch[1];
                const rows = store.asset_ownership.filter((r) => this.matches(r));
                const data = rows.map((r) => {
                    const assetRow = store.asset.find((a) => a.id === r.asset_id);
                    return { asset: assetRow ? project(assetRow, innerCols) : null };
                });
                return { data, error: null };
            }
            return this.selectRows(store.asset_ownership);
        }

        if (this.op === "insert") {
            const data = (Array.isArray(this.mutationData) ? this.mutationData[0] : this.mutationData) as {
                user_id: string;
                asset_id: string;
            };
            store.asset_ownership.push({ ...data });
            return this.mutationResult([data]);
        }

        if (this.op === "upsert") return this.runUpsert(store.asset_ownership);

        return { data: null, error: { message: `Mock: unsupported asset_ownership.${this.op}` } };
    }

    private runAssetSelection(): PostgrestResult {
        if (this.op === "select") return this.selectRows(store.asset_selection);
        if (this.op === "upsert") return this.runUpsert(store.asset_selection);
        return { data: null, error: { message: `Mock: unsupported asset_selection.${this.op}` } };
    }

    private runUpsert<T extends object>(arr: T[]): PostgrestResult {
        const rows = (Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData]) as T[];
        const conflictCols = (this.upsertOpts.onConflict ?? "").split(",").map((s) => s.trim()).filter(Boolean);

        for (const row of rows) {
            const rowRecord = row as Record<string, unknown>;
            const existingIdx = conflictCols.length
                ? arr.findIndex((r) => conflictCols.every((c) => (r as Record<string, unknown>)[c] === rowRecord[c]))
                : -1;
            if (existingIdx >= 0) {
                if (this.upsertOpts.ignoreDuplicates) continue;
                Object.assign(arr[existingIdx], row);
            } else {
                arr.push({ ...row });
            }
        }
        return { data: null, error: null };
    }
}

function getUser(jwt: string) {
    const decoded = decodeMockJwt(jwt);
    if (!decoded) return { data: { user: null }, error: { message: "Invalid mock token" } };

    const authUser = store.authUsers.find((u) => u.id === decoded.id);
    if (!authUser) return { data: { user: null }, error: { message: "User not found" } };

    return {
        data: {
            user: {
                id: authUser.id,
                email: authUser.email,
                user_metadata: { username: authUser.username, date_of_birth: authUser.date_of_birth },
            },
        },
        error: null,
    };
}

export function createMockSupabaseClient() {
    return {
        auth: {
            async getUser(jwt: string) {
                return getUser(jwt);
            },
        },
        from(table: string) {
            return new MockQueryBuilder(table);
        },
    };
}
