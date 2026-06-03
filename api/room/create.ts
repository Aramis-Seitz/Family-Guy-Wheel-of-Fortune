import { randomBytes } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function generateRoomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

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

  const roomKey = generateRoomKey();

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const hostUsername = (hostProfile as { username?: string } | null)?.username ?? user.id;

  const { error: insertError } = await supabase
    .from('rooms')
    .insert({ room_key: roomKey, host_id: user.id, players: [hostUsername] });

  if (insertError) {
    console.error('[room/create] insert error:', insertError);
    res.status(500).json({ error: 'Failed to create room' });
    return;
  }

  res.status(200).json({ roomKey, players: [hostUsername] });
}
