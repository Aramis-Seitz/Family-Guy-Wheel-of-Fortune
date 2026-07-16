import { supabaseClient } from "../shared/supabase-client";
import { optionalElement } from "../shared/dom-helpers";
import type { Session, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { namesInWheelListState, MAX_ITEMS } from "../names/names-in-wheel-list-state";
import { isNameEditingLocked } from "../names/names-in-wheel-list";
import { isSpinning } from "../wheel/spin";
import { showToast } from "../shared/toast";
import { getUserCoins, getUserProfile as fetchUserProfileFromApi } from "../api/user-api";
import { notifyAccountChanged } from "../shared/auth-channel";
import { activeRoomKey, executeLeaveRoom } from "../room";

export const profileName = optionalElement<HTMLSpanElement>("user-profile-name");
export const authButton = optionalElement<HTMLButtonElement>("auth-button");
export const coinDisplay = optionalElement<HTMLSpanElement>("user-coin-display");

async function fetchCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session?.user) return null;
  return session;
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

interface ProfileData {
  username: string;
  coins: number;
}

function applyAuthenticatedState(profile: ProfileData | null): void {
  if (!profileName || !authButton) return;
  const username = profile?.username ?? "Eingeloggt";
  profileName.textContent = username;

  if (profile) {
    applyCoinDisplay(profile.coins ?? 0);
  }

  profileName.classList.add("user-profile-name--clickable");
  profileName.title = "Klick — zum Rad hinzufügen";
  profileName.addEventListener("click", () => {
    if (isNameEditingLocked() || isSpinning()) return;
    if (!namesInWheelListState.addNameToWheelList(username)) {
      showToast({ message: `Maximal ${MAX_ITEMS} Einträge erlaubt.`, type: "error" });
      return;
    }
    showToast({ message: `"${username}" wurde zum Rad hinzugefügt.`, type: "success" });
  });

  authButton.textContent = "Logout";
  authButton.addEventListener("click", async () => {
    if (activeRoomKey) await executeLeaveRoom();
    await supabaseClient.auth.signOut();
    notifyAccountChanged();
    window.location.href = "/login.html";
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

  const coins = await getUserCoins();
  applyCoinDisplay(coins);
}

export async function initProfileUI(): Promise<void> {
  if (!profileName || !authButton) return;

  const session = await fetchCurrentSession();
  if (!session) {
    applyUnauthenticatedState();
    return;
  }

  const profile = await fetchUserProfileFromApi();
  applyAuthenticatedState(profile);
  subscribeToCoinUpdates(session.user.id);
}
