import { Router } from 'express';
import { randomBytes } from 'crypto';
import { createServiceClient } from '../supabase';

export const router = Router();

function generateRoomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

router.post('/', async (req, res) => {
  const jwt = (req.headers['authorization'] ?? '').replace(/^Bearer\s+/, '');
  if (!jwt) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) { res.status(401).json({ error: 'Invalid session' }); return; }

  const roomKey = generateRoomKey();

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const hostUsername: string = (hostProfile as { username?: string } | null)?.username ?? user.id;

  const { error: insertError } = await supabase
    .from('rooms')
    .insert({ room_key: roomKey, host_id: user.id, players: [hostUsername] });

  if (insertError) {
    console.error('[room/create] insert error:', insertError);
    res.status(500).json({ error: 'Failed to create room' });
    return;
  }

  res.json({ roomKey, players: [hostUsername] });
});
