import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
const envDir = path.resolve(__dirname, '..');
if (existsSync(path.join(envDir, '.env.local'))) dotenv.config({ path: path.join(envDir, '.env.local'), override: true });
dotenv.config({ path: path.join(envDir, '.env') });

import express from "express";
import { createClient } from "@supabase/supabase-js";
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { getSecureRandomNumber } from "./lib/random";
import { createMockServiceClient } from "./mock-service";
import { mockRouter } from "./mock-routes";
import { apiRoutes } from "./routes";

const USE_MOCK = process.env.USE_MOCK === 'true';

if (process.env.HTTPS_PROXY && !USE_MOCK) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const app = express();
const PORT = 3000;
const MIN_ROTATION_DEGREE = 140;
const MAX_ROTATION_DEGREE = 900;
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
};

function requireBasicAuthCookie(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.AUTH_SECRET;
  if (!expected) {
    next();
    return;
  }

  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)basic_auth=([^;]+)/);
  const cookieValue = match?.[1];

  if (cookieValue !== expected) {
    res.redirect(302, '/');
    return;
  }

  next();
}

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(['/login.html', '/main.html', '/signup.html'], requireBasicAuthCookie);
app.use(express.static(path.resolve(__dirname, "../../public/dist/html")));
app.use(express.static(path.resolve(__dirname, "../../public/dist")));
app.use('/api', apiRoutes);

if (USE_MOCK) {
  app.use('/api/mock', mockRouter);
}

function createServiceClient() {
  if (USE_MOCK) return createMockServiceClient();
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

function randomBetween(min: number, max: number): number {
  return Math.floor(getSecureRandomNumber(0, 1) * (max - min + 1)) + min;
}

async function addCoins(supabase: any, userId: string, amount: number): Promise<void> {
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

app.get("/api/random", async (req, res) => {
  const authHeader = req.headers['authorization'] ?? '';
  const jwt = (authHeader as string).replace(/^Bearer\s+/, '');

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

  const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
  const spinToken = randomUUID();

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ token: spinToken, user_id: user.id, used: false })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('spin_token insert error:', tokenError);
    res.status(500).json({ error: 'Failed to create spin token' });
    return;
  }

  res.json({ ranNum, spinToken: (tokenData as any).token ?? spinToken });
});

app.post("/api/award-coins", async (req, res) => {
  const authHeader = req.headers['authorization'] ?? '';
  const jwt = (authHeader as string).replace(/^Bearer\s+/, '');

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
    console.error('Token validation Failed:', tokenError?.message, '|user:', user.id);
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
    console.log(`[coins] ${spinnerName} hat selbst gewonnen → +${spinnerCoins + winnerCoins} Coins (${spinnerCoins} Spinner + ${winnerCoins} Winner)`);
    res.json({ spinnerCoins, winnerCoins, total: spinnerCoins + winnerCoins });
    return;
  }

  await addCoins(supabase, user.id, spinnerCoins);
  console.log(`[coins] Spinner: ${spinnerName} → +${spinnerCoins} Coins`);

  if (winnerUserId) {
    const winnerCoins = randomBetween(3, 6);
    await addCoins(supabase, winnerUserId, winnerCoins);
    console.log(`[coins] Winner:  ${winnerName} → +${winnerCoins} Coins`);
    res.json({ spinnerCoins, winnerCoins });
    return;
  }

  console.log(`[coins] Winner:  ${winnerName} → nicht im System, keine Coins`);
  res.json({ spinnerCoins, winnerCoins: 0 });
});

app.post('/api/basic-auth', (req, res) => {
  const { username, password } = req.body ?? {};
  const validUser = process.env.AUTH_USER;
  const validPwd = process.env.AUTH_PWD;
  const authSecret = process.env.AUTH_SECRET;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Benutzername und Passwort erforderlich.' });
    return;
  }

  if (!validUser || !validPwd || !authSecret) {
    res.status(500).json({ success: false, message: 'Auth-Konfiguration fehlt.' });
    return;
  }

  if (username !== validUser || password !== validPwd) {
    res.status(401).json({ success: false, message: 'Ungültige Zugangsdaten.' });
    return;
  }

  res.setHeader(
    'Set-Cookie',
    `basic_auth=${authSecret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
  );

  res.status(200).json({ success: true });
});

app.post('/api/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'basic_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.status(200).json({ success: true });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

export default app;
