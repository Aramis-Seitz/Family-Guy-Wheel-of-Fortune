import { profileName } from "../profile/profiles";
import { applyActiveAssets } from "../shared/asset-selection";
import { ensureDefaultAssets } from "../profile/user-api";
import { initInventory } from "../inventory/inventory";
import { initNamesInWheelList } from "../names/names-in-wheel-list";
import { initShareFeature } from "../names/share-names-in-wheel-list";
import { initProfileUI } from "../profile/profiles";
import { initWheelControls } from "../wheel/spin";
import { initMultiplierButton } from "../wheel/multiplier";
import { initVolumeSlider } from "../wheel/volume";
import { preloadStaticSounds } from "../wheel/sound";
import { initWinnerModal } from "../wheel/winner";
import { initRoomUnloadGuard, redirectIfNoSession } from "../multiplayer/room-session-guard";
import { activeRoomKey } from "../multiplayer/room-state";
import { initRoomButtons, initAddNameInput, enableRoomButtons } from "../multiplayer/room-buttons";
import { setMyUsername } from "../multiplayer/room-orchestration";
import { initShop } from "../shop/shop";
import { initAuthChannelListener } from "../shared/auth-channel";
import { localizeHtmlElements } from "./html-localization";
import { initI18n, t } from "./i18n";
import { initLanguageSwitcher } from "./language-switcher";
import { initTheme } from "./theme";
import { showLoadingScreenFor } from "./loading-screen";


function initMobileMenu(): void {
  const toggle = document.getElementById("mobile-menu-toggle") as HTMLButtonElement | null;
  const overlay = document.getElementById("mobile-menu-overlay") as HTMLDivElement | null;
  const closeButton = document.getElementById("mobile-menu-close-btn") as HTMLButtonElement | null;

  if (!toggle || !overlay) return;

  const closeMenu = (): void => {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const openMenu = (): void => {
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  toggle.addEventListener("click", () => {
    if (overlay.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeButton?.addEventListener("click", closeMenu);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

async function initApp(): Promise<void> {
  await initI18n();
  localizeHtmlElements();
  initMobileMenu();
  initTheme();
  initLanguageSwitcher();
  if (false && await redirectIfNoSession()) return;
  initRoomUnloadGuard(() => activeRoomKey);
  initNamesInWheelList();
  initAddNameInput();
  initMultiplierButton();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  initShareFeature();
  initAuthChannelListener();
  await initProfileUI();
  setMyUsername(profileName?.textContent?.trim() || t("generic.anonymous"));
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomButtons();
  initWinnerModal();
  enableRoomButtons();
}

void showLoadingScreenFor(initApp());