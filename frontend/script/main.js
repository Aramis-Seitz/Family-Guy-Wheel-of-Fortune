import { input, addBtn } from "./dom.js";
import { spinWheelWithRandomSteps, resetWheelRotation } from "./wheel-spin.js";
import { addName, syncRemoveButtons, updateEmptyState, initExistingItems, refreshWheel, getNames, } from "./name-list.js";
import { generateWheel } from "./wheel-renderer.js";
// --- Event Listeners ---
addBtn.addEventListener("click", () => addName(input.value));
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
        addName(input.value);
});
// --- Global functions (used by onclick in HTML) ---
function getRandomNumber_left() {
    spinWheelWithRandomSteps("left");
}
function getRandomNumber_right() {
    spinWheelWithRandomSteps("right");
}
window.getRandomNumber_left = getRandomNumber_left;
window.getRandomNumber_right = getRandomNumber_right;
window.generateWheel = () => generateWheel(getNames());
window.resetWheelRotation = resetWheelRotation;
// --- Initialization ---
initExistingItems();
syncRemoveButtons();
updateEmptyState();
refreshWheel();
