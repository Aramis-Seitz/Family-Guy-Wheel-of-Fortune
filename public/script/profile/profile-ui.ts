import { optionalElement } from "../shared/dom-helpers";
import { namesInWheelListState, ADD_NAME_REJECTION, MAX_ITEMS } from "../names/names-in-wheel-list-state";
import { isNameEditingLocked } from "../names/names-in-wheel-list";
import { isSpinning } from "../wheel/spin";
import { showToast } from "../shared/toast";
import { notifyAccountChanged } from "../shared/auth-channel";
import { activeRoomKey } from "../multiplayer/room-state";
import { executeLeaveRoom } from "../multiplayer/room-orchestration";
import { showSwitchRoomConfirm } from "../multiplayer/room-buttons";
import { formatNumber } from "../app/format";
import { t } from "../app/i18n";
import { profileData, type UserProfileState } from "./profile-data";

export const profileName = optionalElement<HTMLSpanElement>("user-profile-name");
export const authButton = optionalElement<HTMLButtonElement>("auth-button");
export const coinDisplay = optionalElement<HTMLSpanElement>("user-coin-display");

let initialized = false;

function applyUnauthenticatedState(): void {
  if (!profileName || !authButton) return;
  profileName.textContent = t("profile.notLoggedIn");
  authButton.textContent = t("profile.login");
}

function applyCoinDisplay(coins: number): void {
  if (!coinDisplay) return;
  coinDisplay.textContent = `🪙 ${formatNumber(coins)}`;
  coinDisplay.style.display = "inline";
}

function applyAuthenticatedState(state: UserProfileState): void {
  if (!profileName || !authButton) return;
  profileName.textContent = state.username ?? t("profile.loggedIn");
  applyCoinDisplay(state.coins);

  profileName.classList.add("user-profile-name--clickable");
  profileName.title = t("profile.clickToAdd");

  authButton.textContent = t("profile.logout");
}

function render(state: UserProfileState): void {
  if (!state.isAuthenticated) {
    applyUnauthenticatedState();
    return;
  }
  applyAuthenticatedState(state);
}

function bindProfileActions(): void {
  profileName?.addEventListener("click", () => {
    const username = profileData.getState().username;
    if (!username || isNameEditingLocked() || isSpinning()) return;
    const addResult = namesInWheelListState.addNameToWheelList(username);
    if (!addResult.added) {
      showToast({
        message: addResult.code === ADD_NAME_REJECTION.DUPLICATE
          ? t("names.duplicate", { name: username })
          : t("profile.maxItems", { max: MAX_ITEMS }),
        type: "error",
      });
      return;
    }
    showToast({ message: t("profile.added", { username }), type: "success" });
  });

  authButton?.addEventListener("click", () => {
    if (!profileData.getState().isAuthenticated) {
      window.location.href = "/login.html";
      return;
    }
    showSwitchRoomConfirm(t("room.logoutConfirm"), async () => {
      if (activeRoomKey) await executeLeaveRoom();
      await profileData.signOut();
      notifyAccountChanged();
      window.location.href = "/login.html";
    });
  });
}

export async function initProfileUI(): Promise<void> {
  if (!profileName || !authButton) return;

  if (!initialized) {
    initialized = true;
    bindProfileActions();
    profileData.subscribe(render);
    window.addEventListener("app:language-changed", () => render(profileData.getState()));
  }

  await profileData.initializeProfile();
  render(profileData.getState());
}

export async function refreshCoinDisplay(): Promise<void> {
  if (!coinDisplay) return;
  if (!profileData.getState().isAuthenticated) return;
  await profileData.refreshCoins();
}
