import { createClient } from '@supabase/supabase-js';
import { createMockClient } from '../mock-supabase-client.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const supabaseClient = USE_MOCK
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
