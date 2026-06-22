import { multiplierSlider, multiplierValue } from "../shared/dom.js";
import { DEFAULT_MULTIPLIER } from "../shared/constants.js";

export function setMultiplierSlider(multiplier: number): void {
  multiplierSlider.value = `${multiplier}`;
}

export function updateMultiplierDisplay(): void {
  if (!multiplierSlider || !multiplierValue) return;
  multiplierValue.textContent = multiplierSlider.value;
}

export function initMultiplierSlider(): void {
  multiplierSlider?.addEventListener("input", updateMultiplierDisplay);
  updateMultiplierDisplay();
}

export function disableMultiplierSlider(): void {
  if (multiplierSlider) multiplierSlider.disabled = true;
}

export function enableMultiplierSlider(): void {
  if (multiplierSlider) multiplierSlider.disabled = false;
}

export function getMultiplier(): number {
  const value = parseFloat(multiplierSlider.value);
  return Number.isNaN(value) ? DEFAULT_MULTIPLIER : value;
}
