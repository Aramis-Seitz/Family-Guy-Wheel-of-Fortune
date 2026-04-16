import { input, addBtn } from "./dom.js";
import { initShareFeature } from "public/script/share-name-list.js";
import { spinWheelWithRandomSteps, resetWheelRotation, initMultiplierSlider } from "./wheel-spin.js";
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

// --- Event Listeners ---

addBtn.addEventListener("click", () => addName(input.value));

input.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") addName(input.value);
});

// --- Global functions (used by onclick in HTML) ---

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

// --- Initialization ---

initExistingItems();
syncRemoveButtons();
updateEmptyState();
refreshWheel();
syncAddElements();
initMultiplierSlider();
initShareFeature();