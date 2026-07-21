import { requiredElement } from "../shared/dom-helpers";
import { ASSET_CATEGORIES } from "../shop/shop";
import { isMultiplayerActive } from "../multiplayer/room";
import { loadInventoryByCategory } from "./inventory";
import { renderCategoryTabs, getActiveCategory } from "../shared/category-tabs";

export const INVENTORY_CATEGORIES: string[] = ["wheel", ...ASSET_CATEGORIES] as const;
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

const inventoryTabs = requiredElement<HTMLElement>("inventory-modal-tabs");

export function getActiveInventoryCategory(): InventoryCategory | null {
  return getActiveCategory<InventoryCategory>(inventoryTabs, "inventory-modal");
}

export async function loadInventoryTabs(): Promise<void> {
  const categories = isMultiplayerActive() ? INVENTORY_CATEGORIES.filter(category => category !== "wheel") : INVENTORY_CATEGORIES;

  renderCategoryTabs(inventoryTabs, categories, {
    cssPrefix: "inventory-modal",
    onSelect: loadInventoryByCategory,
  });
}
