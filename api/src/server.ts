import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: true });
dotenv.config();

import express from "express";
import path from "path";
import { SupabaseClient } from "@supabase/supabase-js";
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { getSecureRandomNumber } from "./utils/random";
import { mockRouter } from "./mock-routes";
import { createServiceClient } from "./supabase";
import { router as roomCreateRouter } from "./room/create";
import { router as roomJoinRouter } from "./room/join";
import { router as roomSpinRouter } from "./room/spin";
import { router as roomCloseRouter } from "./room/close";

const USE_MOCK = process.env.USE_MOCK === 'true';

if (process.env.HTTPS_PROXY && !USE_MOCK) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const app = express();
const PORT = 3000;
const MIN_ROTATION_DEGREE = 140;
const MAX_ROTATION_DEGREE = 900;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public/dist/html")));
app.use(express.static(path.join(__dirname, "../../public/dist")));

if (USE_MOCK) {
  app.use('/api/mock', mockRouter);
}

app.use('/api/room/create', roomCreateRouter);
app.use('/api/room/join', roomJoinRouter);
app.use('/api/room/spin', roomSpinRouter);
app.use('/api/room/close', roomCloseRouter);

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addCoins(supabase: SupabaseClient, userId: string, amount: number): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = (profile as { coins: number } | null)?.coins ?? 0;

  await supabase
    .from('profiles')
    .update({ coins: currentCoins + amount })
    .eq('id', userId);
}

app.post("/api/random", async (req, res) => {
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

  const { names, currentRotation, direction, multiplier } = req.body ?? {};

  if (!Array.isArray(names) || names.length < 2) {
    res.status(400).json({ error: 'names must be an array with at least 2 entries' });
    return;
  }

  const segmentCount: number = names.length;
  const stepAngle = 360 / segmentCount;

  const safeRotation = typeof currentRotation === 'number' ? currentRotation : 0;
  const safeMultiplier = typeof multiplier === 'number' && multiplier > 0 ? multiplier : 1;

  // Generate random spin amount as before
  const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);

  // Compute actual final rotation based on all frontend context
  const totalSteps = Math.floor(ranNum * safeMultiplier);
  const finalRotation = direction === 'left'
    ? safeRotation - totalSteps
    : safeRotation + totalSteps;

  // Pointer is at 270° (left side of wheel), so the segment under the pointer
  // is at SVG angle (270 - finalRotation), not (+finalRotation)
  const normalizedFinal = ((270 - finalRotation) % 360 + 360) % 360;
  const winnerIndex = Math.floor(normalizedFinal / stepAngle) % segmentCount;
  const winnerName = names[winnerIndex] as string;

  console.log('[spin] ── INPUT ──────────────────────────────');
  console.log(`[spin]  names          : [${names.join(', ')}]`);
  console.log(`[spin]  currentRotation: ${safeRotation}`);
  console.log(`[spin]  direction      : ${direction}`);
  console.log(`[spin]  multiplier     : ${safeMultiplier}`);
  console.log('[spin] ── BERECHNUNG ────────────────────────');
  console.log(`[spin]  ranNum         : ${ranNum}`);
  console.log(`[spin]  totalSteps     : ${totalSteps}  (floor(${ranNum} × ${safeMultiplier}))`);
  console.log(`[spin]  finalRotation  : ${finalRotation}  (${safeRotation} ${direction === 'left' ? '-' : '+'} ${totalSteps})`);
  console.log(`[spin]  normalizedFinal: ${normalizedFinal}  ((270 - ${finalRotation}) mod 360)`);
  console.log(`[spin]  stepAngle      : ${stepAngle}  (360 / ${segmentCount})`);
  console.log('[spin] ── ERGEBNIS ─────────────────────────');
  console.log(`[spin]  winnerIndex    : ${winnerIndex}`);
  console.log(`[spin]  winnerName     : "${winnerName}"`);
  console.log('[spin] ───────────────────────────────────────');

  const spinToken = randomUUID();

  const { data: tokenData, error: tokenError } = await supabase
    .from('spin_tokens')
    .insert({ token: spinToken, user_id: user.id, used: false, winner_name: winnerName })
    .select('token')
    .single();

  if (tokenError || !tokenData) {
    console.error('spin_token insert error:', tokenError);
    res.status(500).json({ error: 'Failed to create spin token' });
    return;
  }

  // winnerName wird NICHT zurückgeschickt – das Frontend liest es selbst vom Zeiger ab
  res.json({ ranNum, spinToken: (tokenData as { token: string }).token ?? spinToken });
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
    .select('token, user_id, used, winner_name')
    .eq('token', spinToken)
    .eq('user_id', user.id)
    .eq('used', false)
    .single();

  if (tokenError || !tokenData) {
    console.error('Token validation Failed:', tokenError?.message, '|user:', user.id);
    res.status(403).json({ error: 'Invalid or already used spin token' });
    return;
  }

  const storedWinner = (tokenData as { winner_name: string | null }).winner_name;
  if (storedWinner && storedWinner !== winnerName) {
    console.warn(`[award-coins] ⚠ Gewinner-Mismatch! DB: "${storedWinner}" | Frontend: "${winnerName}"`);
  } else {
    console.log(`[award-coins] ✓ Gewinner bestätigt: "${winnerName}"`);
  }

  await supabase.from('spin_tokens').update({ used: true }).eq('token', spinToken);

  const spinnerCoins = randomBetween(1, 3);

  const { data: spinnerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const spinnerName = (spinnerProfile as { username: string } | null)?.username ?? user.id;

  const { data: winnerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', winnerName)
    .single();

  const winnerUserId = (winnerProfile as { id: string } | null)?.id ?? null;
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

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

export default app;
