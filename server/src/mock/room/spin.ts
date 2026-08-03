import { Router } from 'express';
import { randomUUID } from 'crypto';
import { createServiceClient } from '../supabase';
import { getSecureRandomNumber } from '../../lib/random';

export const router = Router();

//const MIN_ROTATION_DEGREE = 140;
//const MAX_ROTATION_DEGREE = 900;

router.post('/', async (req, res) => {
  // const jwt = (req.headers['authorization'] ?? '').replace(/^Bearer\s+/, '');
  // if (!jwt) { res.status(401).json({ error: 'Unauthorized' }); return; }

  // const supabase = createServiceClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  // if (authError || !user) { res.status(401).json({ error: 'Invalid session' }); return; }

  // const { roomKey, direction } = (req.body ?? {}) as { roomKey?: string; direction?: string };
  // if (!roomKey) { res.status(400).json({ error: 'Missing roomKey' }); return; }
  // if (direction !== 'left' && direction !== 'right') { res.status(400).json({ error: 'Missing or invalid direction' }); return; }

  // const { data: room, error: roomError } = await supabase
  //   .from('rooms')
  //   .select('host_id')
  //   .eq('room_key', roomKey)
  //   .single();

  // if (roomError || !room) { res.status(404).json({ error: 'Room not found' }); return; }

  // if ((room as { host_id: string }).host_id !== user.id) {
  //   res.status(403).json({ error: 'Only the host may spin' });
  //   return;
  // }

  // const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
  // const spunAt = new Date().toISOString();

  // const { error: updateError } = await supabase
  //   .from('rooms')
  //   .update({ last_spin: ranNum, spun_at: spunAt, spin_direction: direction })
  //   .eq('room_key', roomKey);

  // if (updateError) {
  //   console.error('[room/spin] update error:', updateError);
  //   res.status(500).json({ error: 'Failed to update room spin' });
  //   return;
  // }

  // const spinToken = randomUUID();

  // const { data: tokenData, error: tokenError } = await supabase
  //   .from('spin_tokens')
  //   .insert({ token: spinToken, user_id: user.id, used: false })
  //   .select('token')
  //   .single();

  // if (tokenError || !tokenData) {
  //   console.error('[room/spin] spin_token insert error:', tokenError);
  //   res.status(500).json({ error: 'Failed to create spin token' });
  //   return;
  // }

  // res.json({ ranNum, spinToken: (tokenData as { token: string }).token ?? spinToken });
});
