import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSecureRandomNumber(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers['authorization'] ?? '';
  const jwt = String(authHeader).replace(/^Bearer\s+/, '');

  if (!jwt) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const ranNum = getSecureRandomNumber(140, 900);

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ user_id: user.id })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('spin_token insert error:', tokenError);
    res.status(500).json({ error: 'Failed to create spin token' });
    return;
  }

  res.json({ ranNum, spinToken: (tokenData as any).token });
}
