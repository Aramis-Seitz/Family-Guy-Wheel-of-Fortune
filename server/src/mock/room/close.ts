import { Router } from 'express';
import { createServiceClient } from '../supabase';

export const router = Router();

router.post('/', async (req, res) => {
  const jwt = (req.headers['authorization'] ?? '').replace(/^Bearer\s+/, '');
  if (!jwt) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) { res.status(401).json({ error: 'Invalid session' }); return; }

  const { roomKey } = (req.body ?? {}) as { roomKey?: string };
  if (!roomKey) { res.status(400).json({ error: 'Missing roomKey' }); return; }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('host_id')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) { res.status(404).json({ error: 'Room not found' }); return; }

  if ((room as { host_id: string }).host_id !== user.id) {
    res.status(403).json({ error: 'Only the host may close the room' });
    return;
  }

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ players: [] })
    .eq('room_key', roomKey);

  if (updateError) {
    console.error('[room/close] update error:', updateError);
    res.status(500).json({ error: 'Failed to close room' });
    return;
  }

  res.json({ ok: true });
});
