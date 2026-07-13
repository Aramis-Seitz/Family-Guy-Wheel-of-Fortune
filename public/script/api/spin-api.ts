import { postJson, getAccessToken, ApiError } from "./api-helpers";
import type * as spin from "../wheel/spin";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";
import type { SpinRandomResponseBody, AwardCoinsResponseBody } from "shared";

export async function fetchRandomNumber(
  names: string[],
  currentRotation: number,
  direction: spin.Direction,
  multiplier: number
): Promise<SpinRandomResponseBody> {

  const rawData = await postJson(
    "/api/spin/random",
    { names, currentRotation, direction, multiplier }, {
    errorFallback: "Server response not ok."
  });
  const data = SpinRandomResponseSchema.parse(rawData);

  console.log("[SPIN] /api/spin/random Daten:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "LEER ← Backend-Env-Variablen fehlen wahrscheinlich!",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] ⚠️ spinToken ist leer – Coins werden NICHT vergeben!");
  }

  return data;
}

export async function awardCoins(spinToken: string, winnerName: string): Promise<AwardCoinsResponseBody | null> {
  if (!spinToken) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const rawBody = await postJson("/api/spin/award-coins", { spinToken, winnerName }, {
      token: accessToken,
      errorFallback: "Award coins request failed."
    });
    return AwardCoinsResponseSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[award-coins] fehlgeschlagen:", error.status, error.message);
    }
    throw error;
  }
}
