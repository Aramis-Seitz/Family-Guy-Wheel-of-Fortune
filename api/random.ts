import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomInt, randomUUID } from 'crypto';

function getSecureRandomNumber(min: number, max: number): number {
  return randomInt(min, max + 1);
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
  const spinToken = randomUUID();

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ token: spinToken, user_id: user.id, used: false })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('spin_token insert error:', tokenError);
    res.status(500).json({ error: 'Failed to create spin token' });
    return;
  }

  res.json({ ranNum, spinToken: (tokenData as any).token ?? spinToken });
}
