import { supabaseClient } from "../shared/supabase-client.js";
import { profileName, authButton, coinDisplay } from "../shared/dom.js";
import { ProfileData } from "../shared/types.js";
import type { Session } from "@supabase/supabase-js";

async function fetchCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session?.user) return null;
  return session;
}

async function fetchUserProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("username, coins")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Profil konnte nicht geladen werden:", error);
    return null;
  }

  return data;
}

function applyUnauthenticatedState(): void {
  if (!profileName || !authButton) return;
  profileName.textContent = "Nicht eingeloggt";
  authButton.textContent = "Login";
  authButton.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}

function applyCoinDisplay(coins: number): void {
  if (!coinDisplay) return;
  coinDisplay.textContent = `🪙 ${coins}`;
  coinDisplay.style.display = "inline";
}

function applyAuthenticatedState(profile: ProfileData | null): void {
  if (!profileName || !authButton) return;
  profileName.textContent = profile?.username ?? "Eingeloggt";

  if (profile) {
    applyCoinDisplay(profile.coins ?? 0);
  }

  authButton.textContent = "Logout";
  authButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
  });
}

export async function initProfileUI(): Promise<void> {
  if (!profileName || !authButton) return;

  const session = await fetchCurrentSession();
  if (!session) {
    applyUnauthenticatedState();
    return;
  }

  const profile = await fetchUserProfile(session.user.id);
  applyAuthenticatedState(profile);
}