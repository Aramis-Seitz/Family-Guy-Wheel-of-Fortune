import { requiredElement } from "../shared/dom-helpers";
import { formatMultiplier } from "../app/format";

export const multiplierSlider = requiredElement<HTMLInputElement>("multiplier-slider");
export const multiplierValue = requiredElement<HTMLSpanElement>("multiplier-value");

export function setMultiplierSlider(multiplier: number): void {
  multiplierSlider.value = `${multiplier}`;
}

export function updateMultiplierDisplay(): void {
  if (!multiplierSlider || !multiplierValue) return;
  multiplierValue.textContent = formatMultiplier(Number(multiplierSlider.value));
}

export function initMultiplierSlider(): void {
  multiplierSlider?.addEventListener("input", updateMultiplierDisplay);
  updateMultiplierDisplay();
  window.addEventListener("app:language-changed", updateMultiplierDisplay);
}

export const DEFAULT_MULTIPLIER: number = 1;

export function getMultiplier(): number {
  const value = parseFloat(multiplierSlider.value);
  return Number.isNaN(value) ? DEFAULT_MULTIPLIER : value;
}
