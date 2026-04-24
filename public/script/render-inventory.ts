import { supabaseClient } from "./supabase-client.js";

type InventoryItem = {
  id: number;
  title: string;
  link?: string | null;
};

const inventoryGrid = document.getElementById("inventoryGrid") as HTMLDivElement | null;
const level: number = 12;

function renderInventory(items: InventoryItem[]): void {
  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = "";

  for (let i = 0; i < level; i++) {
    const item = items[i];

    if (!item) {
      const emptyCard = document.createElement("div");
      emptyCard.className = "inventory-card empty";
      emptyCard.textContent = "Leer";
      inventoryGrid.appendChild(emptyCard);
      continue;
    }

    const hasValidLink = typeof item.link === "string" && item.link.trim() !== "";

    const card = hasValidLink
      ? document.createElement("a")
      : document.createElement("div");

    card.classList.add("inventory-card");

    if (hasValidLink && card instanceof HTMLAnchorElement) {
      card.href = item.link!;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    card.innerHTML = `
      <div class="inventory-card-content">
        <h3>${item.title}</h3>
      </div>
    `;

    inventoryGrid.appendChild(card);
  }
}

async function loadInventory(): Promise<void> {
  const { data: userData } = await supabaseClient.auth.getUser();

  const user = userData.user;

  if (!user) {
    console.error("Kein User eingeloggt");
    renderInventory([]);
    return;
  }

  const { data, error } = await supabaseClient
    .schema("public")
    .from("save_links")
    .select(`
      id,
      title:link_name,
      link:url
    `)
    .eq("user_id", user.id)
    .order("id", { ascending: true })
    .limit(12);

  if (error) {
    console.error("Fehler beim Laden:", error);
    return;
  }

  renderInventory(data ?? []);
}

loadInventory();