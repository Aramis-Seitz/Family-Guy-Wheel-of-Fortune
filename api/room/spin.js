import { randomInt, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'] ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  const { roomKey, names } = req.body ?? {};
  if (!roomKey) return res.status(400).json({ error: 'Missing roomKey' });

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('host_id')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) return res.status(404).json({ error: 'Room not found' });
  if (room.host_id !== user.id) return res.status(403).json({ error: 'Only the host may spin' });

  const ranNum = randomInt(140, 901);
  const spunAt = new Date().toISOString();

  const nameList = Array.isArray(names) && names.length > 0 ? names : [];
  const winnerName = nameList.length > 0 ? nameList[ranNum % nameList.length] : '';

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ last_spin: ranNum, spun_at: spunAt })
    .eq('room_key', roomKey);

  if (updateError) {
    console.error('[room/spin] update error:', updateError);
    return res.status(500).json({ error: 'Failed to update room spin' });
  }

  const spinToken = randomUUID();

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ token: spinToken, user_id: user.id, used: false, winner_name: winnerName })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('[room/spin] spin_token insert error:', tokenError);
    return res.status(500).json({ error: 'Failed to create spin token' });
  }

  return res.status(200).json({ ranNum, spinToken: tokenData.token, winnerName });
}
