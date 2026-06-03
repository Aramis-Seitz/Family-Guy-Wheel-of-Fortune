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

  const { roomKey } = (req.body ?? {}) as { roomKey?: string };
  if (!roomKey) {
    res.status(400).json({ error: 'Missing roomKey' });
    return;
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, players')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = (profile as { username?: string } | null)?.username ?? user.id;
  const currentPlayers: string[] = (room as { players?: string[] }).players ?? [];
  const updatedPlayers = currentPlayers.includes(username)
    ? currentPlayers
    : [...currentPlayers, username];

  const { data: updated, error: updateError } = await supabase
    .from('rooms')
    .update({ players: updatedPlayers })
    .eq('room_key', roomKey)
    .select('players')
    .single();

  if (updateError || !updated) {
    console.error('[room/join] update error:', updateError);
    res.status(500).json({ error: 'Failed to join room' });
    return;
  }

  res.status(200).json({ players: (updated as { players: string[] }).players });
}
