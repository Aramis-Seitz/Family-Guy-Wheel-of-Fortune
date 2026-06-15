import {
  addBtn,
  getRemoveBtn,
  input,
  multiplierSlider,
  multiplierValue,
  resetBtn,
  spinLeftBtn,
  spinRightBtn,
  wheelElement,
} from "../shared/dom.js";
import { playTickSound, playDrumRoll, stopDrumRoll, playCymbalCrash } from "./sound.js";
import { fetchRandomNumber } from "../api/client-api.js";
import { getSegmentCount, getNames } from "../names/name-list.js";
import { announceWinner } from "./winner.js";
import {
  FULL_CIRCLE_DEG,
  POINTER_OFFSET_DEG,
  MIN_ITEMS,
  DRUMROLL_LEAD_IN_STEPS,
  MAX_SPIN_VELOCITY,
  MIN_SPIN_VELOCITY,
  SPIN_FAST_PHASE_RATIO,
  SPIN_EASE_EXPONENT,
  SPIN_DISABLED_OPACITY,
  MIN_SPIN_ROTATIONS,
  DEFAULT_MULTIPLIER,
} from "../shared/constants.js";
import type { Direction, SpinConfig, SpinHandler, SpinElement, SpinFrameState } from "../shared/types.js";

let currentRotation = 0;
let lastTickRotation = 0;
let spinCancelled = false;
let activeSpinOverride: SpinHandler | null = null;

export function setSpinOverride(handler: SpinHandler | null): void {
  activeSpinOverride = handler;
}

export function lockSpinButtons(): void {
  setElementsDisabled(getSpinRelatedElements(), true);
}

export function unlockSpinButtons(): void {
  setElementsDisabled(getSpinRelatedElements(), false);
}

function updateWheelRotation(): void {
  wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}

function getSpinRelatedElements(): SpinElement[] {
  return [input, addBtn, getRemoveBtn(), spinLeftBtn, spinRightBtn, multiplierSlider];
}

function applyDisabledStyle(el: HTMLButtonElement | HTMLInputElement, disabled: boolean): void {
  el.disabled = disabled;
  if (disabled) {
    el.style.setProperty("opacity", SPIN_DISABLED_OPACITY);
    el.style.setProperty("cursor", "not-allowed");
    el.style.setProperty("pointer-events", "none");
  } else {
    el.style.removeProperty("opacity");
    el.style.removeProperty("cursor");
    el.style.removeProperty("pointer-events");
  }
}

function setElementsDisabled(
  elements: SpinElement[],
  disabled: boolean,
): void {
  const flat = elements.flatMap((el) => (el instanceof NodeList ? [...el] : el ? [el] : []));
  flat.forEach((el) => applyDisabledStyle(el, disabled));
}

function getSegmentIndex(rotation: number, stepAngle: number): number {
  const offsetRotation = rotation - POINTER_OFFSET_DEG;
  const normalizedRotation = ((offsetRotation % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  return Math.floor(normalizedRotation / stepAngle);
}

function hasEnteredNewSegment(stepAngle: number): boolean {
  const previous = getSegmentIndex(lastTickRotation, stepAngle);
  const current = getSegmentIndex(currentRotation, stepAngle);
  return previous !== current;
}

function computeVelocity(progress: number): number {
  if (progress < SPIN_FAST_PHASE_RATIO) return MAX_SPIN_VELOCITY;
  const decelRatio = (progress - SPIN_FAST_PHASE_RATIO) / (1 - SPIN_FAST_PHASE_RATIO);
  return MIN_SPIN_VELOCITY + (MAX_SPIN_VELOCITY - MIN_SPIN_VELOCITY) * Math.pow(1 - decelRatio, SPIN_EASE_EXPONENT);
}

function resolveWinner(rotation: number, config: SpinConfig): string {
  const names = getNames();
  const pointerAngle = ((POINTER_OFFSET_DEG - rotation) % FULL_CIRCLE_DEG + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  const winnerIndex = Math.floor(pointerAngle / config.stepAngle) % config.segmentCount;
  return names[winnerIndex] ?? names[0];
}

function finishSpin(config: SpinConfig): void {
  stopDrumRoll();
  playCymbalCrash();
  announceWinner(config.spinToken, resolveWinner(currentRotation, config));
}

function runSpinFrame(state: SpinFrameState, config: SpinConfig): void {
  if (spinCancelled) { stopDrumRoll(); return; }

  const velocity = computeVelocity(state.distanceTravelled / config.totalSteps);
  currentRotation += velocity * state.sign;
  state.distanceTravelled += velocity;

  updateWheelRotation();
  if (hasEnteredNewSegment(config.stepAngle)) playTickSound();
  lastTickRotation = currentRotation;
  if (state.distanceTravelled > config.totalSteps - DRUMROLL_LEAD_IN_STEPS) playDrumRoll();

  if (state.distanceTravelled >= config.totalSteps) {
    finishSpin(config);
  } else {
    requestAnimationFrame(() => runSpinFrame(state, config));
  }
}

function animateSpin(config: SpinConfig): void {
  const state: SpinFrameState = {
    distanceTravelled: 0,
    sign: config.direction === "right" ? 1 : -1,
  };
  requestAnimationFrame(() => runSpinFrame(state, config));
}

export function spinWheel(totalSteps: number, direction: Direction, spinToken: string): void {
  spinCancelled = false;
  const segmentCount = getSegmentCount();
  if (segmentCount < MIN_ITEMS) return;

  const clampedSteps = Math.max(Math.floor(totalSteps), MIN_SPIN_ROTATIONS);

  const config: SpinConfig = {
    totalSteps: clampedSteps,
    direction,
    stepAngle: FULL_CIRCLE_DEG / segmentCount,
    segmentCount,
    spinToken,
  };

  animateSpin(config);
}

export async function spinWheelWithRandomSteps(direction: Direction): Promise<void> {
  if (getSegmentCount() < MIN_ITEMS) return;

  lockSpinButtons();

  try {
    const names = getNames();
    const multiplier = getMultiplier();
    const { ranNum: rawSteps, spinToken } = await fetchRandomNumber(names, currentRotation, direction, multiplier);
    spinWheel(Math.floor(rawSteps * multiplier), direction, spinToken);
  } catch (error) {
    console.error("[SPIN] Fehler beim Spin:", error);
    unlockSpinButtons();
  }
}

export function resetWheelRotation(): void {
  spinCancelled = true;
  currentRotation = 0;
  lastTickRotation = 0;
  updateWheelRotation();
  unlockSpinButtons();
  stopDrumRoll();
}

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

export function getMultiplier(): number {
  const value = parseFloat(multiplierSlider.value);
  return Number.isNaN(value) ? DEFAULT_MULTIPLIER : value;
}

export function getCurrentRotation(): number {
  return currentRotation;
}

export function initWheelControls(): void {
  spinLeftBtn.addEventListener("click", () => {
    void (activeSpinOverride ? activeSpinOverride("left") : spinWheelWithRandomSteps("left"));
  });

  spinRightBtn.addEventListener("click", () => {
    void (activeSpinOverride ? activeSpinOverride("right") : spinWheelWithRandomSteps("right"));
  });

  resetBtn.addEventListener("click", resetWheelRotation);
}
