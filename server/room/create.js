import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function generateRoomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

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

  const roomKey = generateRoomKey();

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const hostUsername = hostProfile?.username ?? user.id;

  const { error: insertError } = await supabase
    .from('rooms')
    .insert({ room_key: roomKey, host_id: user.id, players: [hostUsername] });

  if (insertError) {
    console.error('[room/create] insert error:', insertError);
    return res.status(500).json({ error: 'Failed to create room' });
  }

  return res.status(200).json({ roomKey, players: [hostUsername] });
}
