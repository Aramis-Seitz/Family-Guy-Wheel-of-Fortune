import { getSecureRandomNumber } from "./dist/utils/random.js";
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
    const ranNum = getSecureRandomNumber(360, 900);
 
  // Wenn Env-Vars nicht gesetzt: Rad funktioniert, aber keine Coins
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ ranNum, spinToken: '' });
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

  try {
    const ranNum = getSecureRandomNumber(360, 900);

    const { data: tokenData, error: tokenError } = await supabase
      .from('spin_tokens')
      .insert({ user_id: user.id })
      .select('token')
      .single();

    if (tokenError || !tokenData) {
      return res.status(500).json({ error: 'Failed to create spin token' });
    }

    res.status(200).json({ ranNum, spinToken: tokenData.token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate number' });
  }
}
