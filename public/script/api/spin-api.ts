import { postJson, getAccessToken, ApiError } from "./api-helpers";
import type { Direction } from "../wheel/spin";
import { SpinRandomResponseSchema, AwardCoinsResponseSchema } from "shared";
import type { SpinRandomResponseBody, AwardCoinsResponseBody } from "shared";

export async function fetchRandomNumber(
  names: string[],
  currentRotation: number,
  direction: Direction,
  multiplier: number
): Promise<SpinRandomResponseBody> {

  const rawData = await postJson(
    "/api/spins",
    { names, currentRotation, direction, multiplier }, {
    errorFallbackKey: "api.spin.randomFailed"
  });
  const data = SpinRandomResponseSchema.parse(rawData);

  console.log("[SPIN] /api/spins Daten:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "LEER ← Backend-Env-Variablen fehlen wahrscheinlich!",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] ⚠️ spinToken ist leer – Coins werden NICHT vergeben!");
  }

  return data;
}

// Übergibt nur die Position des Gewinners auf dem Rad. Welcher Account dahinter
// steckt (oder ob es ein von Hand eingetragener Name ohne Account ist), hat der
// Server beim Spin selbst aufgelöst und am Spin-Token festgehalten.
export async function awardCoins(spinToken: string, winnerIndex: number): Promise<AwardCoinsResponseBody | null> {
  if (!spinToken) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const rawBody = await postJson(`/api/spins/${spinToken}/award`, { winnerIndex }, {
      token: accessToken,
      errorFallbackKey: "api.spin.awardFailed"
    });
    return AwardCoinsResponseSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[award-coins] fehlgeschlagen:", error.status, error.message);
    }
    throw error;
  }
}
