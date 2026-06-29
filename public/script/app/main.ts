import { initNameList } from "../names/name-list.js";
import { initMultiplierSlider } from "../wheel/multiplier.js";
import { initVolumeSlider } from "../wheel/volume.js";
import { preloadStaticSounds } from "../wheel/sound.js";
import { initWheelControls } from "../wheel/spin.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import { ensureDefaultAssets } from "../api/user-api.js";
import { applyActiveAssets } from "../shared/asset-selection.js";
import { initInventory } from "../inventory/inventory.js";
import { initShop } from "../shop/shop.js";
import { initRoomControls, initNameControls, hasActiveSession } from "./room-controls.js";
import { initWinnerModal } from "../wheel/winner.js";

async function initApp(): Promise<void> {
  if (!(await hasActiveSession())) {
    window.location.href = "/login.html";
    return;
  }

  initNameList();
  initNameControls();
  initMultiplierSlider();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  initShareFeature();
  await initProfileUI();
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomControls();
  initWinnerModal();
}

void initApp();
