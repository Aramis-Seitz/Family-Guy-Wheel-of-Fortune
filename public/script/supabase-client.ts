import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);