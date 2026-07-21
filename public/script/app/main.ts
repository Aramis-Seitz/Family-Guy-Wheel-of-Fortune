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
import { initRoomUnloadGuard, activeRoomKey, initRoomControls, initNameControls, setMyUsername, redirectIfNoSession } from "../multiplayer/room";
import { initShop } from "../shop/shop";
import { initAuthChannelListener } from "../shared/auth-channel";


async function initApp(): Promise<void> {
  if (await redirectIfNoSession()) return;
  initRoomUnloadGuard(() => activeRoomKey);
  initNamesInWheelList();
  initNameControls();
  initMultiplierSlider();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  initShareFeature();
  initAuthChannelListener();
  await initProfileUI();
  setMyUsername(profileName?.textContent?.trim() || 'Anonym');
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomControls();
  initWinnerModal();
}

void initApp();