import type { AwardCoinsResponse, RandomResponse } from "../shared/types.js";
import type { Direction } from "../shared/types.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { apiUrl } from "../shared/api-base.js";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return session?.access_token ?? "";
}

export async function fetchRandomNumber(
  names: string[],
  currentRotation: number,
  direction: Direction,
  multiplier: number
): Promise<{ ranNum: number; spinToken: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(apiUrl("/api/random"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ names, currentRotation, direction, multiplier }),
  });

  if (!response.ok) {
    throw new Error("Server response not ok.");
  }

  const data: RandomResponse = await response.json();
  console.log("[SPIN] /api/random Daten:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "LEER ← Backend-Env-Variablen fehlen wahrscheinlich!",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] ⚠️ spinToken ist leer – Coins werden NICHT vergeben!");
  }

  return { ranNum: data.ranNum, spinToken: data.spinToken };
}

export async function awardCoins(spinToken: string): Promise<AwardCoinsResponse | null> {
  if (!spinToken) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch(apiUrl("/api/award-coins"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ spinToken }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error("[award-coins] fehlgeschlagen:", response.status, body);
    throw new Error("Award coins request failed.");
  }

  return response.json() as Promise<AwardCoinsResponse>;
}
