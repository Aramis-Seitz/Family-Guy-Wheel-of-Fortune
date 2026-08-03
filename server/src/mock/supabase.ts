import { createClient } from '@supabase/supabase-js';
import { createMockServiceClient } from './service';

export function createServiceClient() {
  if (process.env.USE_MOCK === 'true') return createMockServiceClient();
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}
