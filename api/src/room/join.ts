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
    .select('id, players')
    .eq('room_key', roomKey)
    .single();

  if (roomError || !room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username: string = (profile as { username?: string } | null)?.username ?? user.id;
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

  res.json({ players: (updated as { players: string[] }).players });
});
