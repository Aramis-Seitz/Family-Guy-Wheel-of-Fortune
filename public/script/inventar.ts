import { inventoryBtn } from "./dom.js";
import { inventoryCloseBtn } from "./dom.js";
import { inventoryModal } from "./dom.js";


inventoryBtn.addEventListener("click", () => inventoryModal.showModal());

inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());

inventoryModal.addEventListener("click", (e) => {
    const rect = inventoryModal.getBoundingClientRect();
      const outside =
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom;
      if (outside) inventoryModal.close();
});
