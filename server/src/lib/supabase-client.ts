import { createClient } from "@supabase/supabase-js";
import { createMockServiceClient } from "../mock/service";

// Supabase-Client für Backend, um auf die Datenbank zuzugreifen

const USE_MOCK = process.env.USE_MOCK === "true";
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!USE_MOCK && !SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL environment variable");
}

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!USE_MOCK && !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

export const supabaseClient = USE_MOCK
    ? (createMockServiceClient() as any)
    : createClient(SUPABASE_URL as string, SUPABASE_KEY as string);