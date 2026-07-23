import { supabaseClient } from "../shared/supabase-client";
import { optionalElement } from "../shared/dom-helpers";
import type { Session, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { namesInWheelListState, MAX_ITEMS } from "../names/names-in-wheel-list-state";
import { isNameEditingLocked } from "../names/names-in-wheel-list";
import { isSpinning } from "../wheel/spin";
import { showToast } from "../shared/toast";
import { getUserCoins, getUserProfile as fetchUserProfileFromApi } from "../api/user-api";
import { notifyAccountChanged } from "../shared/auth-channel";
import { activeRoomKey, executeLeaveRoom, showSwitchRoomConfirm } from "../room";
import { formatNumber } from "../app/format";
import { t } from "../app/i18n";

export const profileName = optionalElement<HTMLSpanElement>("user-profile-name");
export const authButton = optionalElement<HTMLButtonElement>("auth-button");
export const coinDisplay = optionalElement<HTMLSpanElement>("user-coin-display");
let currentProfile: ProfileData | null = null;
let initialized = false;

async function fetchCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session?.user) return null;
  return session;
}

function applyUnauthenticatedState(): void {
  if (!profileName || !authButton) return;
  currentProfile = null;
  profileName.textContent = t("profile.notLoggedIn");
  authButton.textContent = t("profile.login");
}

function applyCoinDisplay(coins: number): void {
  if (!coinDisplay) return;
  coinDisplay.textContent = `🪙 ${formatNumber(coins)}`;
  coinDisplay.style.display = "inline";
}

interface ProfileData {
  username: string;
  coins: number;
}

function applyAuthenticatedState(profile: ProfileData | null): void {
  if (!profileName || !authButton) return;
  currentProfile = profile;
  const username = profile?.username ?? t("profile.loggedIn");
  profileName.textContent = username;

  if (profile) {
    applyCoinDisplay(profile.coins ?? 0);
  }

  profileName.classList.add("user-profile-name--clickable");
  profileName.title = t("profile.clickToAdd");

  authButton.textContent = t("profile.logout");

}

function bindProfileActions(): void {
  profileName?.addEventListener("click", () => {
    const username = currentProfile?.username;
    if (!username || isNameEditingLocked() || isSpinning()) return;
    if (!namesInWheelListState.addNameToWheelList(username)) {
      showToast({ message: t("profile.maxItems", { max: MAX_ITEMS }), type: "error" });
      return;
    }
    showToast({ message: t("profile.added", { username }), type: "success" });
  });

  authButton?.addEventListener("click", () => {
    if (!currentProfile) {
      window.location.href = "/login.html";
      return;
    }
    showSwitchRoomConfirm("room.logoutConfirm", async () => {
      if (activeRoomKey) await executeLeaveRoom();
      await supabaseClient.auth.signOut();
      notifyAccountChanged();
      window.location.href = "/login.html";
    });
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

  if (!initialized) {
    initialized = true;
    bindProfileActions();
    window.addEventListener("app:language-changed", () => {
      if (currentProfile) applyAuthenticatedState(currentProfile);
      else applyUnauthenticatedState();
    });
  }

  const session = await fetchCurrentSession();
  if (!session) {
    applyUnauthenticatedState();
    return;
  }

  const profile = await fetchUserProfileFromApi();
  applyAuthenticatedState(profile);
  subscribeToCoinUpdates(session.user.id);
}
