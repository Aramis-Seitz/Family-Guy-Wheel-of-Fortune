import { FULL_CIRCLE_RADIANS, INVENTORY_LIMIT, SVG_NS, MINI_CENTER, MINI_RADIUS } from "../shared/constants.js";
import {
  addItemModal,
  addItemInput,
  cancelAddItemBtn,
  closeAddItemBtn,
  confirmAddItemBtn,
  confirmDeleteBtn,
  confirmDeleteModal,
  confirmDeleteName,
  inventoryBtn,
  inventoryCloseBtn,
  inventoryGrid,
  inventoryModal,
  cancelDeleteBtn,
  closeOnBackdropClick
} from "../shared/dom.js";
import { supabaseClient, fetchCurrentUser } from "../shared/supabase-client.js";
import { generateShareLink } from "../names/share-name-list.js";
import { InventoryItem } from "../shared/types.js";
import { getSegmentColor, getPointOnCircle } from "../wheel/renderer.js";
import { showToast } from "../shared/toast.js";

let pendingDeleteId: string | null = null;

function openDeleteModal(id: string, title: string): void {
  pendingDeleteId = id;
  confirmDeleteName.textContent = title;
  confirmDeleteModal.showModal();
}

async function openInventoryModal(): Promise<void> {
  await loadInventory();
  inventoryModal.showModal();
}

async function confirmDelete(): Promise<void> {
  confirmDeleteModal.close();
  if (!pendingDeleteId) return;

  const success = await deleteItem(pendingDeleteId);
  pendingDeleteId = null;

  if (success) await loadInventory();
}

function cancelDelete(): void {
  confirmDeleteModal.close();
  pendingDeleteId = null;
}

async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabaseClient
    .from("saved_links")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Fehler beim Löschen:", error);
    showToast({
      message: "Löschen fehlgeschlagen. Bitte versuche es erneut.",
      type: "error"
    });
    return false;
  }

  showToast({
    message: "Eintrag erfolreich gelöscht.",
    type: "success"
  });
  return true;
}

function openAddItemModal(): void {
  if (!inventoryModal.open) return;

  addItemInput.value = "";
  addItemModal.showModal();

  setTimeout(() => addItemInput.focus(), 60);
}

function closeAddItemModal(): void {
  addItemModal.close();
}

function renderInventory(items: InventoryItem[]): void {
  inventoryGrid.innerHTML = "";
  let addCardPlaced = false;

  for (let i = 0; i < INVENTORY_LIMIT; i++) {
    const item = items[i];

    if (!item) {
      inventoryGrid.appendChild(addCardPlaced ? createEmptyCard() : createAddCard());
      addCardPlaced = true;
      continue;
    }

    inventoryGrid.appendChild(createItemCard(item));

  }
}

function createAddCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-card add";
  card.id = "addCardBtn";
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
  card.className = "inventory-card empty";
  return card;
}

function createItemCard(item: InventoryItem): HTMLElement {
  const hasValidLink = (item.link ?? "").trim() !== "";
  const card = hasValidLink
    ? document.createElement("a")
    : document.createElement("div");

  card.classList.add("inventory-card");

  if (card instanceof HTMLAnchorElement) {
    card.href = item.link!;
  }

  card.appendChild(buildCardContent(item));

  if (hasValidLink) {
    card.appendChild(createDeleteButton(item));
  }

  return card;
}

function buildCardContent(item: InventoryItem): HTMLDivElement {
  const content = document.createElement("div");
  content.className = "inventory-card-content";

  const names = extractNamesFromLink(item.link);
  if (names.length >= 2) {
    const miniWheel = createMiniWheel(names, 65);
    miniWheel.style.transform = `rotate(${Math.random() * 360}deg)`;
    content.appendChild(miniWheel);
  }

  const heading = document.createElement("h3");
  heading.textContent = item.title;
  content.appendChild(heading);

  return content;
}

function createDeleteButton(item: InventoryItem): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "inventory-delete-btn";
  btn.setAttribute("aria-label", "Eintrag löschen");
  btn.textContent = "🗑️";
  btn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDeleteModal(item.id, item.title);
  });
  return btn;
}

async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const user = await fetchCurrentUser();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("saved_links")
    .select(`
      id,
      title:link_name,
      link:url
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(INVENTORY_LIMIT);

  if (error) {
    console.error("Fehler beim Laden:", error);
    return [];
  }

  return data ?? [];
}

async function loadInventory(): Promise<void> {
  renderInventory(await fetchInventoryItems());
}

async function submitItem(): Promise<void> {
  const name = addItemInput.value.trim();
  if (!name) {
    addItemInput.focus();
    return;
  }

  const user = await fetchCurrentUser();
  if (!user) return;

  const { error } = await supabaseClient
    .from("saved_links")
    .insert({
      user_id: user.id,
      link_name: name,
      url: generateShareLink()
    });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    showToast({
      message: "Speichern fehlgeschlagen. Bitte verusche es erneut.",
      type: "error"
    });
    return;
  }

  closeAddItemModal();
  await loadInventory();
  showToast({
    message: `"${name}" wurde erfolgreich gespeichert.`,
    type: "success"
  });
}

export function initInventory(): void {
  inventoryBtn.addEventListener("click", openInventoryModal);
  inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());
  inventoryModal.addEventListener("click", (e) => {
    const inner = inventoryModal.querySelector(".inventory-content");
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

  confirmDeleteBtn.addEventListener("click", confirmDelete);
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
