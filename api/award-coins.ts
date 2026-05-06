import { createClient, SupabaseClient } from '@supabase/supabase-js';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

async function addCoins(supabase: SupabaseClient, userId: string, amount: number): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = (profile as any)?.coins ?? 0;

  await supabase
    .from('profiles')
    .update({ coins: currentCoins + amount })
    .eq('id', userId);
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers['authorization'] ?? '';
  const jwt = String(authHeader).replace(/^Bearer\s+/, '');

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

  const { spinToken, winnerName } = req.body ?? {};

  if (!spinToken || !winnerName) {
    res.status(400).json({ error: 'Missing spinToken or winnerName' });
    return;
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .select('token, user_id, used')
    .eq('token', spinToken)
    .eq('user_id', user.id)
    .eq('used', false)
    .single();

  if (tokenError || !tokenData) {
    console.error('Token validation failed:', tokenError?.message, '| user:', user.id);
    res.status(403).json({ error: 'Invalid or already used spin token' });
    return;
  }

  await supabase.from('spin_tokens').update({ used: true }).eq('token', spinToken);

  const spinnerCoins = randomBetween(1, 3);

  const { data: spinnerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const spinnerName = (spinnerProfile as any)?.username ?? user.id;

  const { data: winnerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', winnerName)
    .single();

  const winnerUserId = (winnerProfile as any)?.id ?? null;
  const spinnerIsWinner = winnerUserId === user.id;

  if (spinnerIsWinner) {
    const winnerCoins = randomBetween(3, 6);
    await addCoins(supabase, user.id, spinnerCoins + winnerCoins);
    console.log(`[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins`);
    res.json({ spinnerCoins, winnerCoins, total: spinnerCoins + winnerCoins });
    return;
  }

  await addCoins(supabase, user.id, spinnerCoins);
  console.log(`[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`);

  if (winnerUserId) {
    const winnerCoins = randomBetween(3, 6);
    await addCoins(supabase, winnerUserId, winnerCoins);
    console.log(`[coins] Winner: ${winnerName} → +${winnerCoins} Coins`);
    res.json({ spinnerCoins, winnerCoins });
    return;
  }

  console.log(`[coins] Winner: ${winnerName} → nicht im System, keine Coins`);
  res.json({ spinnerCoins, winnerCoins: 0 });
}
