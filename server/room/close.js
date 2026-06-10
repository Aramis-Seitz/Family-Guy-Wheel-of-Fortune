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

  const { roomKey } = req.body ?? {};
  if (!roomKey) return res.status(400).json({ error: 'Missing roomKey' });

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('host_id')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) return res.status(404).json({ error: 'Room not found' });
  if (room.host_id !== user.id) return res.status(403).json({ error: 'Only the host may close the room' });

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ players: [] })
    .eq('room_key', roomKey);

  if (updateError) {
    console.error('[room/close] update error:', updateError);
    return res.status(500).json({ error: 'Failed to close room' });
  }

  return res.status(200).json({ ok: true });
}
