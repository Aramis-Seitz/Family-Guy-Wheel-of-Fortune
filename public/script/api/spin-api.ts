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
    "/api/spin/random",
    { names, currentRotation, direction, multiplier }, {
    errorFallbackKey: "api.spin.randomFailed"
  });
  const data = SpinRandomResponseSchema.parse(rawData);

  console.log("[SPIN] /api/spin/random data:", {
    ranNum: data.ranNum,
    spinToken: data.spinToken || "EMPTY - backend environment variables may be missing",
  });

  if (!data.spinToken) {
    console.warn("[SPIN] spinToken is empty; no coins will be awarded.");
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
      errorFallbackKey: "api.spin.awardFailed"
    });
    return AwardCoinsResponseSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[award-coins] failed:", error.status, error.message);
    }
    throw error;
  }
}
