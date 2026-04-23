import { input, addBtn } from "./dom.js";
import { initShareFeature } from "./share-name-list.js";
import { spinWheelWithRandomSteps, resetWheelRotation, initMultiplierSlider } from "./wheel-spin.js";
import { initProfileUI } from "./profiles.js";
import { inventory } from "./inventory.js";
import { saveWheelDB } from "./save-wheel.js";


import {
  addName,
  syncRemoveButtons,
  syncAddElements,
  updateEmptyState,
  initExistingItems,
  refreshWheel,
  getNames,
} from "./name-list.js";
import { generateWheel } from "./wheel-renderer.js";
import { setupWinnerModal } from "./winner.js";
import { supabaseClient } from './supabase-client.js';

console.log("1main.ts gestartet");
const { data: { session } } = await supabaseClient.auth.getSession();

if (!session) {
  window.location.href = 'login.html';
}



addBtn.addEventListener("click", () => addName(input.value));

input.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") addName(input.value);
});


function getRandomNumber_left(): void {
  spinWheelWithRandomSteps("left");
}

function getRandomNumber_right(): void {
  spinWheelWithRandomSteps("right");
}

(window as any).getRandomNumber_left = getRandomNumber_left;
(window as any).getRandomNumber_right = getRandomNumber_right;
(window as any).generateWheel = () => generateWheel(getNames());
(window as any).resetWheelRotation = resetWheelRotation;

//if (sessionStorage.getItem('isAuthenticated') !== 'true') {
//  window.location.href = '/';
//} entfernt weil sonst loop

initExistingItems();
syncRemoveButtons();
updateEmptyState();
refreshWheel();
syncAddElements();
initMultiplierSlider();
initShareFeature();
setupWinnerModal();
initProfileUI();
inventory();
console.log("2main.ts gestartet");
saveWheelDB();