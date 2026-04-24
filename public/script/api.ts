import type { RandomResponse } from "./types.js";
import { supabaseClient } from "./supabase-client.js";

export async function fetchRandomNumber(): Promise<{ ranNum: number; spinToken: string }> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const accessToken = session?.access_token ?? '';

  const response = await fetch("./api/random", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Server response not ok.");
  }
  const data: RandomResponse = await response.json();
  return { ranNum: data.ranNum, spinToken: data.spinToken };
}
