import { profileName } from "../profile/profiles";
import { applyActiveAssets } from "../shared/asset-selection";
import { ensureDefaultAssets } from "../api/user-api";
import { initInventory } from "../inventory/inventory";
import { initNamesInWheelList } from "../names/names-in-wheel-list";
import { initShareFeature } from "../names/share-names-in-wheel-list";
import { initProfileUI } from "../profile/profiles";
import { initWheelControls } from "../wheel/spin";
import { initMultiplierSlider } from "../wheel/multiplier";
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


async function initApp(): Promise<void> {
  await initI18n();
  localizeHtmlElements();
  initTheme();
  initLanguageSwitcher();
  if (await redirectIfNoSession()) return;
  initRoomUnloadGuard(() => activeRoomKey);
  initNamesInWheelList();
  initAddNameInput();
  initMultiplierSlider();
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

void initApp();