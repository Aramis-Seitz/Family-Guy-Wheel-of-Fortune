import { requiredElement, onActivate } from "../shared/dom-helpers";
import { replaceNames } from "../names/names-in-wheel-list";
import type { SavedWheel } from "shared";
import { getSavedWheels } from "../api/inventory-api";
import { createMiniWheel } from "./inventory-mini-wheel";
import { openDeleteModal } from "./inventory-delete-modal";
import { openSaveWheelModal } from "./inventory-save-wheel-modal";
import { inventoryModal } from "./inventory";

let currentSavedWheels: SavedWheel[] = [];

export const inventoryWheelGrid = requiredElement<HTMLElement>("inventory-modal-wheel-grid");

export async function loadWheelCards(): Promise<void> {
  currentSavedWheels = await getSavedWheels();
  renderInventoryWheels(currentSavedWheels);
}

const MAX_WHEEL_CARDS: number = 12;

function renderInventoryWheels(savedWheels: SavedWheel[]): void {
  for (let i = 0; i < MAX_WHEEL_CARDS; i++) {
    const card = createCardForSlot(savedWheels, i);
    const existing = inventoryWheelGrid.children[i];
    existing ? existing.replaceWith(card) : inventoryWheelGrid.appendChild(card);
  }

  while (inventoryWheelGrid.children.length > MAX_WHEEL_CARDS) {
    inventoryWheelGrid.lastElementChild!.remove();
  }
}

function createCardForSlot(savedWheels: SavedWheel[], index: number): HTMLElement {
  const savedWheel = savedWheels[index];
  if (savedWheel) return createSavedWheelCard(savedWheel);
  return index === savedWheels.length ? createAddCard() : createEmptyCard();
}

function createAddCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-modal__card inventory-modal__card--add";
  card.id = "inventory-modal-add-card-btn";
  card.textContent = "+";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  onActivate(card, openSaveWheelModal);
  return card;
}

function createEmptyCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-modal__card inventory-modal__card--empty";
  return card;
}

function createSavedWheelCard(savedWheel: SavedWheel): HTMLElement {
  const hasValidLink = (savedWheel.link ?? "").trim() !== "";
  const names = extractNamesFromLink(savedWheel.link);
  const card = document.createElement("div");
  card.classList.add("inventory-modal__card");

  if (hasValidLink) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const handleLoad = () => {
      if (names.length > 0) replaceNames(names);
      inventoryModal.close();
    };
    onActivate(card, handleLoad);
  }

  card.appendChild(buildCardContent(savedWheel, names));

  if (hasValidLink) {
    card.appendChild(createDeleteButton(savedWheel));
  }

  return card;
}

function buildCardContent(savedWheel: SavedWheel, names: string[]): HTMLDivElement {
  const content = document.createElement("div");
  content.className = "inventory-modal__card-content";

  if (names.length >= 2) {
    const miniWheel = createMiniWheel(names, 65);
    miniWheel.style.transform = `rotate(${Math.random() * 360}deg)`;
    content.appendChild(miniWheel);
  }

  const heading = document.createElement("h3");
  heading.textContent = savedWheel.title;
  content.appendChild(heading);

  const date = document.createElement("p");
  date.className = "inventory-modal__card-date";
  date.textContent = formatDate(savedWheel.created_at);

  content.appendChild(date);

  return content;
}

function createDeleteButton(savedWheel: SavedWheel): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "inventory-modal__card-delete-btn";
  btn.setAttribute("aria-label", "Eintrag löschen");
  btn.textContent = "🗑️";
  btn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDeleteModal(savedWheel.id, savedWheel.title);
  });
  return btn;
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

const DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

function formatDate(dateString: string): string {
  return DATE_FORMATTER.format(new Date(dateString));
}
