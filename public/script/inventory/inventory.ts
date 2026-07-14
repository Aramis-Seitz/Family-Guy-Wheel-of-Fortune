import { FULL_CIRCLE_RADIANS, SVG_NS, getSegmentColor, getPointOnCircle } from "../wheel/renderer";
import { ASSET_CATEGORIES } from "../shop/shop";
import { requiredElement, closeOnBackdropClick } from "../shared/dom-helpers";
import { generateShareLink } from "../names/share-names-in-wheel-list";
import { replaceNames } from "../names/names-in-wheel-list";
import type { SavedWheel, Asset } from "shared";
import { showToast } from "../shared/toast";
import { loadOwnedAssets, refreshSelectedAssetIds } from "./inventory-assets"
import { getOwnedAssets, deleteSavedWheel, getSavedWheels, saveSavedWheels } from "../api/inventory-api";
import { ApiError } from "../api/api-helpers"
import { isMultiplayerActive } from "../room";

let pendingDeleteId: string | null = null;
let currentOwnedAssets: Asset[] = [];

const confirmDeleteName = requiredElement<HTMLElement>("confirm-delete-modal-name");
const confirmDeleteModal = requiredElement<HTMLDialogElement>("confirm-delete-modal");

function openDeleteModal(id: string, title: string): void {
  pendingDeleteId = id;
  confirmDeleteName.textContent = title;
  confirmDeleteModal.showModal();
}

const inventoryModal = requiredElement<HTMLDialogElement>("inventory-modal");

async function openInventoryModal(): Promise<void> {
  await loadInventory();
  inventoryModal.showModal();
}

async function confirmDeleteWheel(): Promise<void> {
  confirmDeleteModal.close();
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  pendingDeleteId = null;

  try {
    await deleteSavedWheel(id);
    await loadInventory();
    showToast({ message: "Eintrag erfolgreich gelöscht.", type: "success" });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Rad konnte nicht gelöscht werden.";
    showToast({ message, type: "error" });
  }
}

function cancelDelete(): void {
  confirmDeleteModal.close();
  pendingDeleteId = null;
}

const addItemInput = requiredElement<HTMLInputElement>("add-item-input");
const addItemModal = requiredElement<HTMLDialogElement>("add-item-modal");

function openAddItemModal(): void {
  if (!inventoryModal.open) return;

  addItemInput.value = "";
  addItemModal.showModal();

  setTimeout(() => addItemInput.focus(), 60);
}

function closeAddItemModal(): void {
  addItemModal.close();
}

const inventoryWheelGrid = requiredElement<HTMLElement>("inventory-modal-wheel-grid");
const INVENTORY_LIMIT: number = 12;

function renderInventoryWheels(items: SavedWheel[]): void {
  inventoryWheelGrid.innerHTML = "";
  let addCardPlaced = false;

  for (let i = 0; i < INVENTORY_LIMIT; i++) {
    const item = items[i];

    if (!item) {
      inventoryWheelGrid.appendChild(addCardPlaced ? createEmptyCard() : createAddCard());
      addCardPlaced = true;
      continue;
    }

    inventoryWheelGrid.appendChild(createItemCard(item));
  }
}

function createAddCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-modal__card inventory-modal__card--add";
  card.id = "inventory-modal-add-card-btn";
  card.textContent = "+";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", openAddItemModal);
  card.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAddItemModal();
    }
  });
  return card;
}

function createEmptyCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-modal__card inventory-modal__card--empty";
  return card;
}

function createItemCard(item: SavedWheel): HTMLElement {
  const hasValidLink = (item.link ?? "").trim() !== "";
  const card = document.createElement("div");
  card.classList.add("inventory-modal__card");

  if (hasValidLink) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const names = extractNamesFromLink(item.link);
    const handleLoad = () => {
      if (names.length > 0) replaceNames(names);
      inventoryModal.close();
    };
    card.addEventListener("click", handleLoad);
    card.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleLoad();
      }
    });
  }

  card.appendChild(buildCardContent(item));

  if (hasValidLink) {
    card.appendChild(createDeleteButton(item));
  }

  return card;
}

function buildCardContent(item: SavedWheel): HTMLDivElement {
  const content = document.createElement("div");
  content.className = "inventory-modal__card-content";

  const names = extractNamesFromLink(item.link);
  if (names.length >= 2) {
    const miniWheel = createMiniWheel(names, 65);
    miniWheel.style.transform = `rotate(${Math.random() * 360}deg)`;
    content.appendChild(miniWheel);
  }

  const heading = document.createElement("h3");
  heading.textContent = item.title;
  content.appendChild(heading);

  const date = document.createElement("p");
  date.className = "inventory-modal__card-date";
  date.textContent = formatDate(item.created_at);

  content.appendChild(date);

  return content;
}

function createDeleteButton(item: SavedWheel): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "inventory-modal__card-delete-btn";
  btn.setAttribute("aria-label", "Eintrag löschen");
  btn.textContent = "🗑️";
  btn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDeleteModal(item.id, item.title);
  });
  return btn;
}

async function fetchInventoryWheels(): Promise<SavedWheel[]> {
  return await getSavedWheels();
}

async function loadInventory(): Promise<void> {
  await Promise.all([getOwnedAssets().then(a => { currentOwnedAssets = a; }), refreshSelectedAssetIds()]);
  loadInventoryTabs();
  loadInventoryByCategory();
}

async function submitItem(): Promise<void> {
  const name = addItemInput.value.trim();
  if (!name) {
    addItemInput.focus();
    return;
  }

  try {
    await saveSavedWheels(name, generateShareLink());
    closeAddItemModal();
    await loadInventory();
    showToast({
      message: `"${name}" wurde erfolgreich gespeichert.`,
      type: "success"
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Speichern fehlgeschlagen. Bitte versuche es erneut.";
    showToast({ message, type: "error" });
  }
}

const inventoryBtn = requiredElement<HTMLButtonElement>("inventory-btn");
const inventoryCloseBtn = requiredElement<HTMLButtonElement>("inventory-modal-close-btn");
const confirmAddItemBtn = requiredElement<HTMLButtonElement>("add-item-modal-confirm-btn");
const cancelAddItemBtn = requiredElement<HTMLButtonElement>("add-item-modal-cancel-btn");
const closeAddItemBtn = requiredElement<HTMLButtonElement>("add-item-modal-close-btn");
const confirmDeleteBtn = requiredElement<HTMLButtonElement>("confirm-delete-modal-confirm-btn");
const cancelDeleteBtn = requiredElement<HTMLButtonElement>("confirm-delete-modal-cancel-btn");

export function initInventory(): void {
  inventoryBtn.addEventListener("click", openInventoryModal);
  inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());
  inventoryModal.addEventListener("click", (e) => {
    const inner = inventoryModal.querySelector(".inventory-modal__content");
    if (inner && !inner.contains(e.target as Node)) {
      inventoryModal.close();
    }
  });

  confirmAddItemBtn.addEventListener("click", submitItem);
  cancelAddItemBtn.addEventListener("click", closeAddItemModal);
  closeAddItemBtn.addEventListener("click", closeAddItemModal);
  addItemInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitItem();
    }
  });
  closeOnBackdropClick(addItemModal, closeAddItemModal);

  confirmDeleteBtn.addEventListener("click", confirmDeleteWheel);
  cancelDeleteBtn.addEventListener("click", cancelDelete);
  closeOnBackdropClick(confirmDeleteModal, cancelDelete);
}

function extractNamesFromLink(link: string | null): string[] {
  if (!link) return [];

  try {
    const namesParam = new URL(link).searchParams.get("names");
    if (!namesParam) return [];

    const names = JSON.parse(decodeURIComponent(namesParam));
    return Array.isArray(names)
      ? names.filter((n) => typeof n === "string" && n.trim())
      : [];
  } catch {
    return [];
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

const MINI_CENTER = { x: 100, y: 100 };
const MINI_RADIUS = 90;

function createMiniSegment(index: number, count: number): SVGPathElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const start = index * angleStep;
  const end = (index + 1) * angleStep;

  const p1 = getPointOnCircle(MINI_CENTER, MINI_RADIUS, start);
  const p2 = getPointOnCircle(MINI_CENTER, MINI_RADIUS, end);

  const largeArc = angleStep > Math.PI ? 1 : 0;

  const path = document.createElementNS(SVG_NS, "path");

  path.setAttribute(
    "d",
    `M ${MINI_CENTER.x} ${MINI_CENTER.y}
     L ${p1.x} ${p1.y}
     A ${MINI_RADIUS} ${MINI_RADIUS} 0 ${largeArc} 1 ${p2.x} ${p2.y}
     Z`
  );

  path.setAttribute("fill", getSegmentColor(index));
  path.setAttribute("stroke", "black");
  path.setAttribute("stroke-width", "0.5");

  return path;
}

function createMiniWheel(names: string[], size = 70): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");

  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 200 200");

  if (names.length < 2) return svg;

  names.forEach((name, i) => {
    svg.appendChild(createMiniSegment(i, names.length));
    svg.appendChild(createMiniLabel(i, names.length, name));
  });

  return svg;
}

function createMiniLabel(
  index: number,
  count: number,
  name: string
): SVGTextElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const middleAngle = (index + 0.5) * angleStep;

  const labelRadius = MINI_RADIUS * 0.6;
  const point = getPointOnCircle(MINI_CENTER, labelRadius, middleAngle);

  const text = document.createElementNS(SVG_NS, "text");

  text.setAttribute("x", String(point.x));
  text.setAttribute("y", String(point.y));
  text.setAttribute("fill", "black");
  text.setAttribute("font-size", "8");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");

  const angleDeg = (middleAngle * 180) / Math.PI;
  const rotation = angleDeg > 180 ? angleDeg + 90 : angleDeg - 90;

  text.setAttribute(
    "transform",
    `rotate(${rotation} ${point.x} ${point.y})`
  );

  text.textContent = name;

  return text;
}

export const inventoryAssetGrid = requiredElement<HTMLElement>("inventory-modal-asset-grid");
const inventoryTabs = requiredElement<HTMLElement>("inventory-modal-tabs");

export function loadInventoryByCategory(): void {
  inventoryAssetGrid.innerHTML = "";
  inventoryWheelGrid.innerHTML = "";
  const activeTab = inventoryTabs.querySelector(".inventory-modal__tab--active") as HTMLElement | null;
  const activeCategory = getClickedInventoryCategory(activeTab);
  if (!activeCategory) return;

  const isWheel = activeCategory === "wheel";
  inventoryWheelGrid.style.display = isWheel ? "" : "none";
  inventoryAssetGrid.style.display = isWheel ? "none" : "";

  isWheel ? loadWheelCards() : loadOwnedAssets(activeCategory);
}


export const INVENTORY_CATEGORIES: string[] = ["wheel", ...ASSET_CATEGORIES] as const;
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export function getClickedInventoryCategory(inventoryTab: HTMLElement | null): InventoryCategory | null {
  if (inventoryTab?.tagName === "BUTTON" && inventoryTab.dataset.category) {
    return inventoryTab.dataset.category as InventoryCategory;
  }
  return null;
}


export async function loadWheelCards(): Promise<void> {
  renderInventoryWheels(await fetchInventoryWheels());
}

export function filterAssetsByCategory(category: InventoryCategory): Asset[] {
  return currentOwnedAssets.filter(asset => asset.category === category);
}

function createInventoryTabButton(category: InventoryCategory): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "inventory-modal__tab";
  button.dataset.category = category;
  button.textContent = `${category}s`.toUpperCase();

  if (category === "wheel") button.classList.add("inventory-modal__tab--active");

  button.onclick = () => {

    inventoryTabs.querySelectorAll(".inventory-modal__tab").forEach(btn => btn.classList.remove("inventory-modal__tab--active"));
    button.classList.add("inventory-modal__tab--active");
    loadInventoryByCategory();
  };
  return button;
}

function renderInventoryTabs(categories: (InventoryCategory)[]): void {
  inventoryTabs.innerHTML = "";
  categories.forEach(category => {
    inventoryTabs.appendChild(createInventoryTabButton(category));
  });
}

async function loadInventoryTabs(): Promise<void> {
  const categories = isMultiplayerActive() ? INVENTORY_CATEGORIES.filter((category): category is InventoryCategory => category !== "wheel") : INVENTORY_CATEGORIES;

  renderInventoryTabs(categories as InventoryCategory[]);
}