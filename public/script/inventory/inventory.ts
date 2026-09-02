import { requiredElement, initToggleModal } from "../shared/dom-helpers";
import type { Asset } from "shared";
import { renderOwnedAssetCards, refreshSelectedAssetIds } from "./inventory-assets";
import { getOwnedAssets } from "../api/inventory-api";
import { loadWheelCards, inventoryWheelGrid } from "./inventory-wheel-cards";
import { initDeleteModal } from "./inventory-delete-modal";
import { initSaveWheelModal } from "./inventory-save-wheel-modal";
import { loadInventoryTabs, getActiveInventoryCategory, type InventoryCategory } from "./inventory-tabs";
import { renderAchievementsTab } from "../achievements/achievement-ui";

let currentOwnedAssets: Asset[] = [];

export const inventoryModal = requiredElement<HTMLDialogElement>("inventory-modal");
export const inventoryAssetGrid = requiredElement<HTMLElement>("inventory-modal-asset-grid");
export const inventoryAchievementGrid = requiredElement<HTMLElement>("inventory-modal-achievement-grid");

const inventoryBtn = requiredElement<HTMLButtonElement>("inventory-btn");
const inventoryCloseBtn = requiredElement<HTMLButtonElement>("inventory-modal-close-btn");

async function openInventoryModal(): Promise<void> {
  await loadInventory();
  inventoryModal.showModal();
}

async function loadInventory(): Promise<void> {
  const [assets] = await Promise.all([getOwnedAssets(), refreshSelectedAssetIds()]);
  currentOwnedAssets = assets;
  loadInventoryTabs();
  loadInventoryByCategory();
}

export function loadInventoryByCategory(): void {
  inventoryAssetGrid.innerHTML = "";
  inventoryWheelGrid.innerHTML = "";
  inventoryAchievementGrid.innerHTML = "";
  const activeCategory = getActiveInventoryCategory();
  if (!activeCategory) return;

  const isWheel = activeCategory === "wheel";
  const isAchievements = activeCategory === "achievements";

  inventoryWheelGrid.style.display = isWheel ? "" : "none";
  inventoryAchievementGrid.style.display = isAchievements ? "" : "none";
  inventoryAssetGrid.style.display = !isWheel && !isAchievements ? "" : "none";

  if (isWheel) loadWheelCards();
  else if (isAchievements) renderAchievementsTab(inventoryAchievementGrid);
  else renderOwnedAssetCards(activeCategory);
}

export function filterAssetsByCategory(category: InventoryCategory): Asset[] {
  return currentOwnedAssets.filter(asset => asset.category === category);
}

export function initInventory(): void {
  initToggleModal(inventoryModal, inventoryBtn, inventoryCloseBtn, openInventoryModal);

  initSaveWheelModal();
  initDeleteModal();
}
