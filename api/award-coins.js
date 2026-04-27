import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addCoins(supabase, userId, amount) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = profile?.coins ?? 0;

  await supabase
    .from('profiles')
    .update({ coins: currentCoins + amount })
    .eq('id', userId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'] ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/, '');

  if (!jwt) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createServiceClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const { spinToken, winnerName: rawWinnerName } = req.body ?? {};
  const winnerName = typeof rawWinnerName === 'string' ? rawWinnerName.trim() : '';

  if (!spinToken || !winnerName) {
    return res.status(400).json({ error: 'Missing spinToken or winnerName' });
  }

  // Server-seitige Validierung: winnerName darf nur Buchstaben und Zahlen enthalten
  if (!/^[A-Za-z0-9]+$/.test(winnerName)) {
    return res.status(400).json({ error: 'Invalid winnerName: only letters and numbers allowed' });
  }

  // Validate token: must exist, belong to this user, and not yet used
  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .select('token, user_id, used')
    .eq('token', spinToken)
    .eq('user_id', user.id)
    .eq('used', false)
    .single();

  if (tokenError || !tokenData) {
    return res.status(403).json({ error: 'Invalid or already used spin token' });
  }

  // Consume token immediately to prevent double-spend
  await supabase
    .from('spin_tokens')
    .update({ used: true })
    .eq('token', spinToken);

  const spinnerCoins = randomBetween(1, 3);

  // Check if winner is a registered user
  const { data: winnerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', winnerName)
    .single();

  const winnerUserId = winnerProfile?.id ?? null;
  const spinnerIsWinner = winnerUserId === user.id;

  if (spinnerIsWinner) {
    const winnerCoins = randomBetween(3, 6);
    await addCoins(supabase, user.id, spinnerCoins + winnerCoins);
    return res.status(200).json({
      spinnerCoins,
      winnerCoins,
      total: spinnerCoins + winnerCoins,
    });
  }

  await addCoins(supabase, user.id, spinnerCoins);

  if (winnerUserId) {
    const winnerCoins = randomBetween(3, 6);
    await addCoins(supabase, winnerUserId, winnerCoins);
    return res.status(200).json({ spinnerCoins, winnerCoins });
  }

  return res.status(200).json({ spinnerCoins, winnerCoins: 0 });
}
