import { createClient } from '@supabase/supabase-js';
import { createMockClient } from '../mock-supabase-client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type SupabaseUser = {
  id: string;
  email: string;
  user_metadata: { username?: string; date_of_birth?: string | null };
};

type SupabaseAuthResult = {
  data: { user: SupabaseUser | null };
  error: { message: string } | null;
};

interface SupabaseClientLike {
  auth: {
    getUser(): Promise<SupabaseAuthResult>;
  };
}

if (!USE_MOCK && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseClient: SupabaseClientLike = USE_MOCK
  ? createMockClient()
  : createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function fetchCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error('Fehler beim Laden des Users:', error.message);
    return null;
  }

  return user;
}