import { createClient, type SupabaseClient } from "@supabase/supabase-js";


let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!client) {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        if (!SUPABASE_URL) {
            throw new Error("Missing SUPABASE_URL environment variable");
        }

        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_KEY) {
            throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
        }

        client = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return client;
}

export const supabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getClient(), prop, receiver);
    },
});