import { profileName } from "../shared/dom.js";
import { applyActiveAssets } from "../shared/asset-selection.js";
import { ensureDefaultAssets } from "../api/user-api.js";
import { initInventory } from "../inventory/inventory.js";
import { initNameList } from "../names/name-list.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import { initWheelControls, setResetOverride } from "../wheel/spin.js";
import { initMultiplierSlider } from "../wheel/multiplier.js";
import { initVolumeSlider } from "../wheel/volume.js";
import { preloadStaticSounds } from "../wheel/sound.js";
import { initWinnerModal } from "../wheel/winner.js";
import { initRoomUnloadGuard, activeRoomKey, initRoomControls, handleLocalReset, initNameControls, setMyUsername, redirectIfNoSession } from "../room.js";
import { initShop } from "../shop/shop.js";
import { initAuthChannelListener } from "../shared/auth-channel.js";


async function initApp(): Promise<void> {
  if (await redirectIfNoSession()) return;
  initRoomUnloadGuard(() => activeRoomKey);
  initNameList();
  initNameControls();
  initMultiplierSlider();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  setResetOverride(handleLocalReset);
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