import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase-Client für Backend, um auf die Datenbank zuzugreifen.
// Lazy erzeugt: die *.real.ts-Repositories werden vom Dispatcher-Pattern
// (import * as real from "./x.real") immer mitgeladen, auch im Mock-Modus,
// in dem dieser Client nie tatsächlich benutzt wird. Würde er beim reinen
// Import erzeugt, bräuchte man SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY auch
// im Mock-Modus - im Widerspruch zu docs/setup/complete-local.md.

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