import type { AwardCoinsResponse, RandomResponse } from "../shared/types.js";
import { supabaseClient } from "../shared/supabase-client.js";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const token = session?.access_token ?? "";
  console.log("[SPIN] getAccessToken →", token ? `OK (${token.slice(0, 20)}…)` : "LEER – kein aktiver Login!");
  return token;
}

export async function fetchRandomNumber(): Promise<{ ranNum: number; spinToken: string }> {
  console.log("[SPIN] fetchRandomNumber: Anfrage an /api/src/services/random wird gesendet…");
  const accessToken = await getAccessToken();

  const response = await fetch("/api/src/services/random", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  console.log("[SPIN] /api/src/services/random Antwort – Status:", response.status, response.statusText);

  if (!response.ok) {
    console.error("[SPIN] /api/src/services/random fehlgeschlagen:", response.status);
    throw new Error("Server response not ok.");
  }

  const data: RandomResponse = await response.json();
  console.log("[SPIN] /api/src/services/random Daten:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "LEER ← Env-Variablen auf Vercel fehlen wahrscheinlich!",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] ⚠️ spinToken ist leer – Coins werden NICHT vergeben!");
  }

  return { ranNum: data.ranNum, spinToken: data.spinToken };
}

export async function awardCoins(spinToken: string, winnerName: string): Promise<AwardCoinsResponse | null> {
  console.log("[SPIN] awardCoins aufgerufen:", { spinToken: spinToken || "LEER", winnerName });

  if (!spinToken) {
    console.warn("[SPIN] ⚠️ awardCoins abgebrochen – spinToken ist leer!");
    return null;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn("[SPIN] ⚠️ awardCoins abgebrochen – kein Access Token!");
    return null;
  }

  console.log("[SPIN] POST /api/src/services/award-coins wird gesendet…", { spinToken, winnerName });

  const response = await fetch("/api/src/services/award-coins", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ spinToken, winnerName }),
  });

  console.log("[SPIN] /api/src/services/award-coins Antwort – Status:", response.status, response.statusText);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error("[SPIN] /api/src/services/award-coins fehlgeschlagen:", response.status, body);
    throw new Error("Award coins request failed.");
  }

  const result = await response.json() as AwardCoinsResponse;
  console.log("[SPIN] ✅ Coins vergeben:", result);
  return result;
}
