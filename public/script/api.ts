import type { RandomResponse } from "./types.js";

export async function fetchRandomNumber(): Promise<number> {
  const response = await fetch("./api/random");
  if (!response.ok) {
    throw new Error("Server response not ok.");
  }
  const data: RandomResponse = await response.json();
  return data.ranNum;
}
