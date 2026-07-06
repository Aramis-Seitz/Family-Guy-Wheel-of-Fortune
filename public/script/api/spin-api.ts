import { postJson, getAccessToken, ApiError } from "./api-helpers.js";
import type { AwardCoinsResponse, RandomResponse } from "../shared/types.js";
import type { Direction } from "../shared/types.js";


export async function fetchRandomNumber(
  names: string[],
  currentRotation: number,
  direction: Direction,
  multiplier: number
): Promise<{ ranNum: number; spinToken: string }> {

  const data = await postJson<RandomResponse>(
    "/api/spin/random",
    { names, currentRotation, direction, multiplier }, {
    errorFallback: "Server response not ok."
  });

  console.log("[SPIN] /api/spin/random Daten:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "LEER ← Backend-Env-Variablen fehlen wahrscheinlich!",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] ⚠️ spinToken ist leer – Coins werden NICHT vergeben!");
  }

  return { ranNum: data.ranNum, spinToken: data.spinToken };
}

export async function awardCoins(spinToken: string, winnerName: string): Promise<AwardCoinsResponse | null> {
  if (!spinToken) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    return await postJson<AwardCoinsResponse>("/api/spin/award-coins", { spinToken, winnerName }, {
      token: accessToken,
      errorFallback: "Award coins request failed."
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[award-coins] fehlgeschlagen:", error.status, error.message);
    }
    throw error;
  }
}
