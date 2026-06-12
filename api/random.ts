import { randomInt, randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function getSecureRandomNumber(min: number, max: number): number {
  return randomInt(min, max + 1);
}

function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const ranNum = getSecureRandomNumber(360, 900);
    const { names } = (req.body ?? {}) as { names?: unknown };
    const nameList: string[] = Array.isArray(names) && names.length > 0 ? (names as string[]) : [];
    const winnerName = nameList.length > 0 ? nameList[ranNum % nameList.length] : '';

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(200).json({ ranNum, spinToken: '', winnerName });
      return;
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      res.status(200).json({ ranNum, spinToken: '', winnerName });
      return;
    }

    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      res.status(401).json({ error: 'Invalid session', message: authError?.message });
      return;
    }

    const spinToken = randomUUID();

    const { data: tokenData, error: tokenError } = await supabase
      .from('spin_tokens')
      .insert({
        token: spinToken,
        user_id: user.id,
        used: false,
        winner_name: winnerName,
      })
      .select('token')
      .single();

    if (tokenError || !tokenData) {
      res.status(500).json({ error: 'Failed to create spin token', message: tokenError?.message });
      return;
    }

    res.status(200).json({ ranNum, spinToken: (tokenData as { token: string }).token, winnerName });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: 'Failed to generate number', message: err.message });
  }
}
