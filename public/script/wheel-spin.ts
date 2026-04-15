import { SPIN_START_DELAY, SPIN_END_DELAY, DRUMROLL_DELAY_THRESHOLD } from "./constants.js";
import { wheelElement, input, addBtn, spinLeftBtn, spinRightBtn, multiplierValue, multiplierSlider } from "./dom.js";
import { playTickSound, playDrumRoll, stopDrumRoll, playCymbalCrash } from "./sound.js";
import { fetchRandomNumber } from "./api.js";
import { getSegmentCount } from "./name-list.js";
import { announceWinner, resetDisplayWinner } from "./winner.js";
import type { SpinConfig, Direction } from "./types.js";


export let currentRotation = 0;
let lastTickRotation = 0;
let spinCancelled = false;

function updateWheelRotation(): void {
  if (!wheelElement) return;
  wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}

function getSpinRelatedElements(): (HTMLButtonElement | HTMLInputElement | null)[] {
  return [input, addBtn, spinLeftBtn, spinRightBtn, multiplierSlider];
}

function disableElements(elements: (HTMLButtonElement | HTMLInputElement | null)[]): void {
  elements.forEach((element) => {
    if (element) {
      element.disabled = true;
      element.style.setProperty("opacity", "0.5");
      element.style.setProperty("cursor", "not-allowed");
      element.style.setProperty("pointer-events", "none");
    }
  });
}

function enableElements(elements: (HTMLButtonElement | HTMLInputElement | null)[]): void {
  elements.forEach((element) => {
    if (element) {
      element.disabled = false;
      element.style.removeProperty("opacity");
      element.style.removeProperty("cursor");
      element.style.removeProperty("pointer-events");
    }
  });
}

function getSegmentIndex(rotation: number, stepAngle: number): number {
  const halfStep = stepAngle / 2;
  const normalizedRotation = (((rotation + halfStep) % 360) + 360) % 360;
  return Math.floor(normalizedRotation / stepAngle);
}

function hasEnteredNewSegment(stepAngle: number): boolean {
  const previous = getSegmentIndex(lastTickRotation, stepAngle);
  const current = getSegmentIndex(currentRotation, stepAngle);
  return previous !== current;
}

function calculateStepDelay(completedSteps: number, totalSteps: number): number {
  const progress = completedSteps / totalSteps;
  return SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 4);
}

function advanceRotation(direction: Direction): void {
  currentRotation += direction === "right" ? 1 : -1;
  updateWheelRotation();
}

function performSpinStep(step: number, config: SpinConfig): void {
  if (spinCancelled) return;
  advanceRotation(config.direction);
  step++;

  if (hasEnteredNewSegment(config.stepAngle)) playTickSound();
  lastTickRotation = currentRotation;
  if (step >= config.totalSteps) {
    playCymbalCrash();
    announceWinner(config.segmentCount);
    return;
  }

  const delay = calculateStepDelay(step, config.totalSteps);
  if (delay > DRUMROLL_DELAY_THRESHOLD) playDrumRoll();
  setTimeout(() => performSpinStep(step, config), delay);
}

export function spinWheel(totalSteps: number, direction: Direction): void {
  spinCancelled = false;
  const segmentCount = getSegmentCount();
  if (segmentCount < 2) return;

  const config: SpinConfig = {
    totalSteps,
    direction,
    stepAngle: 360 / segmentCount,
    segmentCount,
  };

  performSpinStep(0, config);
}

function logSpinDetails(ranNum: number, multiplier: number, boostedValue: number): void {
  console.log("Number from fs server:", ranNum);
  console.log("Multiplier:", multiplier);
  console.log("Boosted value:", boostedValue);
}

export async function spinWheelWithRandomSteps(direction: Direction): Promise<void> {
  try {
    const ranNum = await fetchRandomNumber();
    const multiplier = getMultiplier();
    const boostedRanNum = ranNum * multiplier;
    logSpinDetails(ranNum, multiplier, boostedRanNum);
    spinWheel(boostedRanNum, direction);
    disableElements(getSpinRelatedElements());
  } catch (error) {
    console.error("Error while getting random value:", error);
  }
}

export function resetWheelRotation(): void {
  spinCancelled = true;
  currentRotation = 0;
  lastTickRotation = 0;
  updateWheelRotation();
  enableElements(getSpinRelatedElements());
  stopDrumRoll();
  resetDisplayWinner();
}

export function updateMultiplierDisplay(): void {
  if (!multiplierSlider || !multiplierValue) return;
  multiplierValue.textContent = multiplierSlider.value;
}

export function initMultiplierSlider(): void {
  multiplierSlider?.addEventListener("input", updateMultiplierDisplay);
  updateMultiplierDisplay();
}

export function getMultiplier(): number {
  if (!multiplierSlider) return 1;
  const value = parseFloat(multiplierSlider.value);
  return Number.isNaN(value) ? 1 : value;
}
