import { profileName } from "../profile/profiles";
import { applyActiveAssets } from "../shared/asset-selection";
import { ensureDefaultAssets } from "../api/user-api";
import { initInventory } from "../inventory/inventory";
import { initNamesInWheelList } from "../names/names-in-wheel-list";
import { initShareFeature } from "../names/share-names-in-wheel-list";
import { initProfileUI } from "../profile/profiles";
import { initWheelControls, setResetOverride } from "../wheel/spin";
import { initMultiplierSlider } from "../wheel/multiplier";
import { initVolumeSlider } from "../wheel/volume";
import { preloadStaticSounds } from "../wheel/sound";
import { initWinnerModal } from "../wheel/winner";
import { initRoomUnloadGuard, activeRoomKey, initRoomControls, handleLocalReset, initNameControls, setMyUsername, redirectIfNoSession } from "../room";
import { initShop } from "../shop/shop";
import { initAuthChannelListener } from "../shared/auth-channel";
import { initI18n, t } from "./i18n";
import { localizeHtmlElements } from "./html-localization";
import { initLanguageSwitcher } from "./language-switcher";


async function initApp(): Promise<void> {
  await initI18n();
  localizeHtmlElements();
  initLanguageSwitcher();
  if (await redirectIfNoSession()) return;
  initRoomUnloadGuard(() => activeRoomKey);
  initNamesInWheelList();
  initNameControls();
  initMultiplierSlider();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  setResetOverride(handleLocalReset);
  initShareFeature();
  initAuthChannelListener();
  await initProfileUI();
  setMyUsername(profileName?.textContent?.trim() || t('generic.anonymous'));
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomControls();
  initWinnerModal();
}

void initApp();