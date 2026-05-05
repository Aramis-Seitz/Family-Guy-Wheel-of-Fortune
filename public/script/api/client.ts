import type { AwardCoinsResponse, RandomResponse } from "../shared/types.js";
import { supabaseClient } from "../shared/supabase-client.js";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return session?.access_token ?? "";
}

export async function fetchRandomNumber(): Promise<{ ranNum: number; spinToken: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch("./api/random", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Server response not ok.");
  }

  const data: RandomResponse = await response.json();
  return { ranNum: data.ranNum, spinToken: data.spinToken };
}

export async function awardCoins(spinToken: string, winnerName: string): Promise<AwardCoinsResponse | null> {
  if (!spinToken) return null;

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/award-coins", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ spinToken, winnerName }),
  });

  if (!response.ok) {
    throw new Error("Award coins request failed.");
  }

  return response.json() as Promise<AwardCoinsResponse>;
}
