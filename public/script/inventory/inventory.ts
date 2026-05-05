import { FULL_CIRCLE_RADIANS, SEGMENT_COLORS } from "../shared/constants.js";
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
  cancelDeleteBtn
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { generateShareLink } from "../names/share-name-list.js";

type InventoryItem = {
  id: string;
  title: string;
  link: string | null;
};

const level: number = 12;

let loadedItems: InventoryItem[] = [];

let pendingDeleteId: string | null = null;

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Fehler beim Laden des Users:", error.message);
    return null;
  }

  return user;
}

function askDelete(id: string, title: string): void {
  pendingDeleteId = id;
  confirmDeleteName.textContent = title;
  confirmDeleteModal.showModal();
}

async function deleteItem(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from("saved_links")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Fehler beim Löschen:", error);
    return;
  }
  await loadInventory();
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

  let addButtonWasCreated = false;

  for (let i = 0; i < level; i++) {
    const item = items[i];

    if (!item) {
      if (!addButtonWasCreated) {
        const addCard = document.createElement("div");
        addCard.className = "inventory-card add";
        addCard.id = "addCardBtn";
        addCard.textContent = "+";
        addCard.setAttribute("role", "button");
        addCard.setAttribute("tabindex", "0");
        addCard.addEventListener("click", openAddItemModal);
        addCard.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openAddItemModal();
          }
        });

        inventoryGrid.appendChild(addCard);
        addButtonWasCreated = true;
      } else {
        const emptyCard = document.createElement("div");
        emptyCard.className = "inventory-card empty";
        emptyCard.textContent = "";
        inventoryGrid.appendChild(emptyCard);
      }

      continue;
    }

    const hasValidLink = item.link !== null && item.link.trim() !== "";

    const card = hasValidLink
      ? document.createElement("a")
      : document.createElement("div");

    card.classList.add("inventory-card");

    if (card instanceof HTMLAnchorElement) {
      card.href = item.link!;
    }

    const content = document.createElement("div");
    content.className = "inventory-card-content";

    const names = extractNamesFromLink(item.link);

    if (names.length >= 2) {
      const miniWheel = createMiniWheel(names, 65);
      miniWheel.style.transform = `rotate(${Math.random() * 360}deg)`;

      content.appendChild(miniWheel);
    }

    const title = document.createElement("h3");
    title.textContent = item.title;

    content.appendChild(title);
    card.appendChild(content);

    if (hasValidLink) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "inventory-delete-btn";
      deleteBtn.setAttribute("aria-label", "Eintrag löschen");
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        askDelete(item.id, item.title);
      });
      (card as HTMLElement).appendChild(deleteBtn);
    }

    inventoryGrid.appendChild(card);

    console.log("LINK:", item.link);
    console.log("NAMES:", extractNamesFromLink(item.link));

  }
}

async function loadInventory(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    renderInventory([]);
    return;
  }

  const { data, error } = await supabaseClient
    .from("saved_links")
    .select(`
      id,
      title:link_name,
      link:url
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(12);

  if (error) {
    console.error("Fehler beim Laden:", error);
    renderInventory([]);
    return;
  }

  loadedItems = data ?? [];
  console.log("Geladene Links:", loadedItems);
  renderInventory(loadedItems);
}

async function submitItem(): Promise<void> {
  const name = addItemInput.value.trim();

  if (!name) {
    addItemInput.focus();
    return;
  }
  const user = await getCurrentUser();
  if (!user) return;

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();

  const link = generateShareLink();

  if (userError || !userData.user) {
    console.error("Nicht eingeloggt");
    return;
  }

  const { error } = await supabaseClient
    .from("saved_links")
    .insert({
      user_id: userData.user.id,
      link_name: name,
      url: link
    });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    return;
  }

  closeAddItemModal();

  await loadInventory();
}

export function initInventory(): void {
  inventoryBtn.addEventListener("click", async () => {
    await loadInventory();
    inventoryModal.showModal();
  });

  inventoryCloseBtn.addEventListener("click", () => {
    inventoryModal.close();
  });

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

  addItemModal.addEventListener("click", (e) => {
    if (e.target === addItemModal) {
      closeAddItemModal();
    }
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    confirmDeleteModal.close();
    if (pendingDeleteId) {
      await deleteItem(pendingDeleteId);
      pendingDeleteId = null;
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    confirmDeleteModal.close();
    pendingDeleteId = null;
  });

  confirmDeleteModal.addEventListener("click", (e) => {
    if (e.target === confirmDeleteModal) {
      confirmDeleteModal.close();
      pendingDeleteId = null;
    }
  });
}

function extractNamesFromLink(link: string | null): string[] {
  if (!link) return [];

  try {
    const url = new URL(link);
    const params = new URLSearchParams(url.search);
    const namesParam = params.get("names");

    if (!namesParam) return [];

    const names = JSON.parse(decodeURIComponent(namesParam));

    if (!Array.isArray(names)) return [];

    return names.filter(n => typeof n === "string" && n.trim());
  } catch {
    return [];
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";

const MINI_CENTER = { x: 100, y: 100 };
const MINI_RADIUS = 90;

function getMiniPoint(center: { x: number; y: number }, radius: number, angle: number) {
  return {
    x: center.x + radius * Math.cos(angle - Math.PI / 2),
    y: center.y + radius * Math.sin(angle - Math.PI / 2),
  };
}

function getMiniColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

function createMiniSegment(index: number, count: number): SVGPathElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const start = index * angleStep;
  const end = (index + 1) * angleStep;

  const p1 = getMiniPoint(MINI_CENTER, MINI_RADIUS, start);
  const p2 = getMiniPoint(MINI_CENTER, MINI_RADIUS, end);

  const largeArc = angleStep > Math.PI ? 1 : 0;

  const path = document.createElementNS(SVG_NS, "path");

  path.setAttribute(
    "d",
    `M ${MINI_CENTER.x} ${MINI_CENTER.y}
     L ${p1.x} ${p1.y}
     A ${MINI_RADIUS} ${MINI_RADIUS} 0 ${largeArc} 1 ${p2.x} ${p2.y}
     Z`
  );

  path.setAttribute("fill", getMiniColor(index));
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

  names.forEach((_, i) => {
    svg.appendChild(createMiniSegment(i, names.length));

    svg.appendChild(createMiniLabel(i, names.length, names[i]));
  });

  return svg;
}
<<<<<<< HEAD:public/script/inventory.ts

function createMiniLabel(
  index: number,
  count: number,
  name: string
): SVGTextElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const middleAngle = (index + 0.5) * angleStep;

  const labelRadius = MINI_RADIUS * 0.6;
  const point = getMiniPoint(MINI_CENTER, labelRadius, middleAngle);

  const text = document.createElementNS(SVG_NS, "text");

  text.setAttribute("x", String(point.x));
  text.setAttribute("y", String(point.y));
  text.setAttribute("fill", "black");
  text.setAttribute("font-size", "8"); // 👈 wichtig: klein!
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
=======
>>>>>>> feature/refactoring:public/script/inventory/inventory.ts
