import { inventoryBtn, inventoryCloseBtn, inventoryModal, inventoryGrid, inventoryContent } from "./dom.js";


export function inventory() {
  inventoryBtn.addEventListener("click", () => inventoryModal.showModal());

  inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());

  inventoryModal.addEventListener("click", (e) => {
    const rect = inventoryModal.getBoundingClientRect();
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom;
    if (outside) inventoryModal.close();
  });

  inventoryGrid.innerHTML = "";

  for (let i = 0; i < 12; i++) {
    const slot = document.createElement("div");
    slot.classList.add("inventory-card");
    inventoryGrid.appendChild(slot);
  }
}

