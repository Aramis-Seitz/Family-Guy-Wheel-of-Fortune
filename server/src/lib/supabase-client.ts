import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMockSupabaseClient } from "../mock/service";

// Supabase-Client für Backend, um auf die Datenbank zuzugreifen.
// Im Mock-Modus (USE_MOCK=true) wird stattdessen ein In-Memory-Ersatz
// zurückgegeben (siehe ../mock/service.ts), damit alle Repositories
// unverändert gegen "supabaseClient" arbeiten können.

const USE_MOCK = process.env.USE_MOCK === "true";

function buildClient(): SupabaseClient {
    if (USE_MOCK) return createMockSupabaseClient() as unknown as SupabaseClient;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
        throw new Error("Missing SUPABASE_URL environment variable");
    }

    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_KEY) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export const supabaseClient = buildClient();