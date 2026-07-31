import { store } from "./store";
import { decodeMockJwt } from "./jwt";

// Die Repositories in server/src/repositories/*.mock.ts greifen seit dem
// Umbau direkt auf den In-Memory-Store zu, statt über einen generischen
// PostgREST-Query-Builder zu gehen. Übrig bleibt hier nur noch auth.getUser,
// weil auth-service.ts direkt gegen den Supabase-Client-Typ programmiert.

    return { data: null, error: { message: `Unsupported: ${t}.${this._op}` } };
  }
}

export function createMockSupabaseClient() {
    return {
        auth: {
            async getUser(jwt: string) {
                return getUser(jwt);
            },
        },
    };
}
