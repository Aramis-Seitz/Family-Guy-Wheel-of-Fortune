import { addBtn, input } from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { initInventory } from "../inventory/inventory.js";
import { addName, initNameList } from "../names/name-list.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import { initMultiplierSlider, initWheelControls } from "../wheel/spin.js";
import { setupWinnerModal } from "../wheel/winner.js";

function initNameControls(): void {
  addBtn.addEventListener("click", () => addName(input.value));

  input.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") addName(input.value);
  });
}

async function hasActiveSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return Boolean(session);
}

async function initApp(): Promise<void> {
  if (!(await hasActiveSession())) {
    window.location.href = "login.html";
    return;
  }

  initNameList();
  initNameControls();
  initMultiplierSlider();
  initWheelControls();
  initShareFeature();
  setupWinnerModal();
  await initProfileUI();
  initInventory();
}

void initApp();
