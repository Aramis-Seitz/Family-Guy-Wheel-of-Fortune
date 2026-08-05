import { requiredElement } from "../shared/dom-helpers";
import { formatMultiplier } from "../app/format";

export const MULTIPLIER_VALUES = [1, 1.25, 1.5, 1.75, 2] as const;
export const DEFAULT_MULTIPLIER = MULTIPLIER_VALUES[0];
export const MULTIPLIER_CHANGE_EVENT = "multiplier-change";

type Multiplier = typeof MULTIPLIER_VALUES[number];

export const multiplierButton = requiredElement<HTMLButtonElement>("multiplier-button");
export const multiplierValue = requiredElement<HTMLSpanElement>("multiplier-value");

let currentMultiplier: Multiplier = DEFAULT_MULTIPLIER;

function normalizeMultiplier(multiplier: number): Multiplier {
  if (!Number.isFinite(multiplier)) return DEFAULT_MULTIPLIER;

  return MULTIPLIER_VALUES.reduce((closest, candidate) =>
    Math.abs(candidate - multiplier) < Math.abs(closest - multiplier) ? candidate : closest
  );
}

export function setMultiplierControlValue(multiplier: number): void {
  currentMultiplier = normalizeMultiplier(multiplier);
  updateMultiplierDisplay();
}

export function updateMultiplierDisplay(): void {
  multiplierValue.textContent = formatMultiplier(currentMultiplier);
}

function advanceMultiplier(): void {
  const currentIndex = MULTIPLIER_VALUES.indexOf(currentMultiplier);
  currentMultiplier = MULTIPLIER_VALUES[(currentIndex + 1) % MULTIPLIER_VALUES.length];
  updateMultiplierDisplay();
  multiplierButton.dispatchEvent(new Event(MULTIPLIER_CHANGE_EVENT));
}

export function initMultiplierButton(): void {
  multiplierButton.addEventListener("click", advanceMultiplier);
  updateMultiplierDisplay();
  window.addEventListener("app:language-changed", updateMultiplierDisplay);
}

export function getMultiplier(): number {
  return currentMultiplier;
}
