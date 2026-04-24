import {
  inventoryBtn,
  inventoryCloseBtn,
  inventoryModal,
  addItemModal,
  addItemInput,
  confirmAddItemBtn,
  cancelAddItemBtn,
  closeAddItemBtn
} from "./dom.js";

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

  console.log("Neues Item:", name);

  closeAddItemModal();

  // Hier später Supabase Insert + Inventory neu laden
}

export function inventory(): void {
  inventoryBtn.addEventListener("click", () => {
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
}