import { supabaseClient } from "../shared/supabase-client.js";
import { profileName, authButton, coinDisplay } from "../shared/dom.js";
import { ProfileData } from "../shared/types.js";
import type { Session, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

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
    await supabaseClient.auth.signOut();
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/index.html";
  });
}

function subscribeToCoinUpdates(userId: string): void {
  if (!coinDisplay) return;

  supabaseClient
    .channel("coin-updates")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
      (payload: RealtimePostgresChangesPayload<{ coins?: number }>) => {
        const coins = (payload.new as { coins?: number })?.coins ?? 0;
        applyCoinDisplay(coins);
      }
    )
    .subscribe();
}

export async function refreshCoinDisplay(): Promise<void> {
  if (!coinDisplay) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("coins")
    .eq("id", session.user.id)
    .single();

  applyCoinDisplay((profile as { coins?: number } | null)?.coins ?? 0);
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
  subscribeToCoinUpdates(session.user.id);
}
