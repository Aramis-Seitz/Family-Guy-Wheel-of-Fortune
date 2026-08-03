import { store } from "./store";
import { decodeMockJwt } from "./jwt";

// Die Repositories in server/src/repositories/*.mock.ts greifen seit dem
// Umbau direkt auf den In-Memory-Store zu, statt über einen generischen
// PostgREST-Query-Builder zu gehen. Übrig bleibt hier nur noch auth.getUser,
// weil auth-service.ts direkt gegen den Supabase-Client-Typ programmiert.

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
    };
}
