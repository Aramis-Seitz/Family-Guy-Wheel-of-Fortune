import { createClient } from "@supabase/supabase-js";
import { createMockServiceClient } from "../mock-service";

const USE_MOCK = process.env.USE_MOCK === "true";

export function createServiceClient() {
    if (USE_MOCK) return createMockServiceClient();
    return createClient(
        process.env.SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );
}
