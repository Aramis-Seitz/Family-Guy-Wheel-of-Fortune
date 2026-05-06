import { createClient } from '@supabase/supabase-js';
import { createMockClient } from '../mock-supabase-client.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export const supabaseClient_ = USE_MOCK
  ? (createMockClient() as any)
  : createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
    );

export async function fetchCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Fehler beim Laden des Users:", error.message);
    return null;
  }

  return user;
}

