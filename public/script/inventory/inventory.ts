import { requiredElement, initToggleModal } from "../shared/dom-helpers";
import type { Asset } from "shared";
import { renderOwnedAssetCards, refreshSelectedAssetIds } from "./inventory-assets";
import { getOwnedAssets } from "../api/inventory-api";
import { loadWheelCards, inventoryWheelGrid } from "./inventory-wheel-cards";
import { initDeleteModal } from "./inventory-delete-modal";
import { initSaveWheelModal } from "./inventory-save-wheel-modal";
import { loadInventoryTabs, getActiveInventoryCategory, type InventoryCategory } from "./inventory-tabs";

let currentOwnedAssets: Asset[] = [];

export const inventoryModal = requiredElement<HTMLDialogElement>("inventory-modal");
export const inventoryAssetGrid = requiredElement<HTMLElement>("inventory-modal-asset-grid");

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
  const activeCategory = getActiveInventoryCategory();
  if (!activeCategory) return;

  const isWheel = activeCategory === "wheel";
  inventoryWheelGrid.style.display = isWheel ? "" : "none";
  inventoryAssetGrid.style.display = isWheel ? "none" : "";

  isWheel ? loadWheelCards() : renderOwnedAssetCards(activeCategory);
}

export function filterAssetsByCategory(category: InventoryCategory): Asset[] {
  return currentOwnedAssets.filter(asset => asset.category === category);
}

export function initInventory(): void {
  initToggleModal(inventoryModal, inventoryBtn, inventoryCloseBtn, openInventoryModal);

  initSaveWheelModal();
  initDeleteModal();
}
