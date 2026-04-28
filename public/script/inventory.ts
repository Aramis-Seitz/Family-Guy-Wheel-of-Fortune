import { supabaseClient } from "./supabase-client.js";

import {
  inventoryBtn,
  inventoryCloseBtn,
  inventoryModal,
  inventoryGrid,
  addItemModal,
  addItemInput,
  confirmAddItemBtn,
  cancelAddItemBtn,
  closeAddItemBtn,
  confirmDeleteModal,
  confirmDeleteName,
  confirmDeleteBtn,
  cancelDeleteBtn
} from "./dom.js";
import { generateShareLink } from "./share-name-list.js";

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
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    card.innerHTML = `
      <div class="inventory-card-content">
        <h3>${item.title}</h3>
      </div>
    `;

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
  }
}

async function loadInventory(): Promise<void> {
  const user = await getCurrentUser();

  if(!user) {
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

export function inventory(): void {
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