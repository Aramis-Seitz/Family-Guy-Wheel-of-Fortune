import { createClient } from "@supabase/supabase-js";

// Supabase-Client für Backend, um auf die Datenbank zuzugreifen

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL environment variable");
}

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

export const supabaseClient = createClient(
    SUPABASE_URL as string,
    SUPABASE_KEY as string
);