import { randomInt, randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = (req.headers['authorization'] ?? '') as string;
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
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

  const { roomKey, names } = (req.body ?? {}) as { roomKey?: string; names?: unknown };
  if (!roomKey) {
    res.status(400).json({ error: 'Missing roomKey' });
    return;
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('host_id')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  if ((room as { host_id: string }).host_id !== user.id) {
    res.status(403).json({ error: 'Only the host may spin' });
    return;
  }

  const ranNum = randomInt(140, 901);
  const spunAt = new Date().toISOString();

  const nameList: string[] = Array.isArray(names) && names.length > 0 ? (names as string[]) : [];
  const winnerName = nameList.length > 0 ? nameList[ranNum % nameList.length] : '';

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ last_spin: ranNum, spun_at: spunAt })
    .eq('room_key', roomKey);

  if (updateError) {
    console.error('[room/spin] update error:', updateError);
    res.status(500).json({ error: 'Failed to update room spin' });
    return;
  }

  const spinToken = randomUUID();

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ token: spinToken, user_id: user.id, used: false, winner_name: winnerName })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('[room/spin] spin_token insert error:', tokenError);
    res.status(500).json({ error: 'Failed to create spin token' });
    return;
  }

  res.status(200).json({ ranNum, spinToken: (tokenData as { token: string }).token, winnerName });
}
