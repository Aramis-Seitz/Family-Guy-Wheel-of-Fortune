import {
  inventoryBtn,
  inventoryCloseBtn,
  inventoryModal,
  inventoryGrid,
  addItemModal,
  addItemInput,
  confirmAddItemBtn,
  cancelAddItemBtn,
  closeAddItemBtn
} from "./dom.js";

interface InventoryItem {
  id: number;
  name: string;
}

const items: InventoryItem[] = [];
let nextId = 1;

function openAddItemModal(): void {
  if (!inventoryModal.open) return;
  addItemInput.value = "";
  addItemModal.showModal();
  setTimeout(() => addItemInput.focus(), 60);
}


function closeAddItemModal(): void {
  addItemModal.close();
}

function submitItem(): void {
  const name = addItemInput.value.trim();
  if (!name) {
    addItemInput.focus();
    return;
  }

  items.push({ id: nextId++, name });
  closeAddItemModal();
  renderGrid();
}

function renderGrid(): void {
  inventoryGrid.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("inventory-card");
    card.textContent = item.name;
    inventoryGrid.appendChild(card);
  });

  const remaining = 12 - items.length;
  for (let i = 0; i < remaining; i++) {
    const slot = document.createElement("div");
    slot.classList.add("inventory-card");

    if (i === 0) {
      slot.classList.add("add");
      slot.textContent = "+";
      slot.setAttribute("role", "button");
      slot.setAttribute("tabindex", "0");
      slot.addEventListener("click", () => openAddItemModal());
      slot.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAddItemModal();
        }
      });
    }

    inventoryGrid.appendChild(slot);
  }
}

export function inventory(): void {

  inventoryBtn.addEventListener("click", () => {
    renderGrid();
    inventoryModal.showModal();
  });

  inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());

  inventoryModal.addEventListener("click", (e) => {
    const inner = inventoryModal.querySelector(".inventory-content");
    if (inner && !inner.contains(e.target as Node)) inventoryModal.close();
  });

  confirmAddItemBtn.addEventListener("click", submitItem);
  cancelAddItemBtn.addEventListener("click", closeAddItemModal);
  closeAddItemBtn.addEventListener("click", closeAddItemModal);

  addItemInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); submitItem(); }
  });

  addItemModal.addEventListener("click", (e) => {
    if (e.target === addItemModal) closeAddItemModal();
  });
}
