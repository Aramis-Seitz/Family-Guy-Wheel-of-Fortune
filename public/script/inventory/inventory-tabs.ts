import { requiredElement } from "../shared/dom-helpers";
import { ASSET_CATEGORIES } from "../shop/shop";
import { isMultiplayerActive } from "../room";
import { loadInventoryByCategory } from "./inventory";

const inventoryTabs = requiredElement<HTMLElement>("inventory-modal-tabs");

export const INVENTORY_CATEGORIES: string[] = ["wheel", ...ASSET_CATEGORIES] as const;
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export function getClickedInventoryCategory(inventoryTab: HTMLElement | null): InventoryCategory | null {
  if (inventoryTab?.tagName === "BUTTON" && inventoryTab.dataset.category) {
    return inventoryTab.dataset.category as InventoryCategory;
  }
  return null;
}

export function getActiveInventoryCategory(): InventoryCategory | null {
  const activeTab = inventoryTabs.querySelector(".inventory-modal__tab--active") as HTMLElement | null;
  return getClickedInventoryCategory(activeTab);
}

export async function loadInventoryTabs(): Promise<void> {
  const categories = isMultiplayerActive() ? INVENTORY_CATEGORIES.filter(category => category !== "wheel") : INVENTORY_CATEGORIES;

  renderInventoryTabs(categories);
}

function renderInventoryTabs(categories: InventoryCategory[]): void {
  inventoryTabs.innerHTML = "";
  const activeCategory = categories[0];
  categories.forEach(category => {
    inventoryTabs.appendChild(createInventoryTabButton(category, activeCategory));
  });
}

function createInventoryTabButton(category: InventoryCategory, activeCategory: InventoryCategory): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "inventory-modal__tab";
  button.dataset.category = category;
  button.textContent = `${category}s`.toUpperCase();

  if (category === activeCategory) button.classList.add("inventory-modal__tab--active");

  button.onclick = () => {
    inventoryTabs.querySelectorAll(".inventory-modal__tab").forEach(btn => btn.classList.remove("inventory-modal__tab--active"));
    button.classList.add("inventory-modal__tab--active");
    loadInventoryByCategory();
  };
  return button;
}
