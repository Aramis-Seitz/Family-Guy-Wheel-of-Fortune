import { playTickSound, playDrumRoll, stopDrumRoll, playCymbalCrash } from "./sound";
import { fetchRandomNumber } from "../api/spin-api";
import { getNamesInWheelList, input, addBtn, getRemoveBtn } from "../names/names-in-wheel-list";
import { announceWinner, resolveWinner, FULL_CIRCLE_DEG, POINTER_OFFSET_DEG } from "./winner";
import { getMultiplier, multiplierSlider } from "./multiplier";
import { wheelElement } from "./renderer";
import { bulkAddToWheelBtn } from "../room";
import { profileName } from "../profile/profiles";
import { MIN_ITEMS } from "../names/names-in-wheel-list-state";
import { requiredElement } from "../shared/dom-helpers";

let spinning = false;

export function isSpinning(): boolean {
  return spinning;
}

export type Direction = "left" | "right";
export type SpinHandler = (direction: Direction) => Promise<void>;
let activeSpinOverride: SpinHandler | null = null;

export function setSpinOverride(handler: SpinHandler | null): void {
  activeSpinOverride = handler;
}

let activeResetOverride: (() => void) | null = null;

export function setResetOverride(handler: (() => void) | null): void {
  activeResetOverride = handler;
}

export function lockSpinButtons(): void {
  setElementsDisabled(getSpinRelatedElements(), true);
  profileName?.classList.remove("user-profile-name--clickable");
}

export function unlockSpinButtons(): void {
  setElementsDisabled(getSpinRelatedElements(), false);
  profileName?.classList.add("user-profile-name--clickable");
}

let currentRotation = 0;

function updateWheelRotation(): void {
  wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}

export const spinLeftBtn = requiredElement<HTMLButtonElement>("spin-left-btn");
export const spinRightBtn = requiredElement<HTMLButtonElement>("spin-right-btn");

export type SpinElement = HTMLButtonElement | HTMLInputElement | NodeListOf<HTMLButtonElement>;

function getSpinRelatedElements(): SpinElement[] {
  const playerToggleButtons = document.querySelectorAll<HTMLButtonElement>(".room__player-toggle-btn");
  const elements: SpinElement[] = [input, addBtn, getRemoveBtn(), spinLeftBtn, spinRightBtn, multiplierSlider, playerToggleButtons];

  if (bulkAddToWheelBtn) {
    elements.push(bulkAddToWheelBtn);
  }

  return elements;
}

export const SPIN_DISABLED_OPACITY: string = "0.5";

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

let lastTickRotation = 0;

function hasEnteredNewSegment(stepAngle: number): boolean {
  const previous = getSegmentIndex(lastTickRotation, stepAngle);
  const current = getSegmentIndex(currentRotation, stepAngle);
  return previous !== current;
}

export const MAX_SPIN_VELOCITY: number = 15;
export const MIN_SPIN_VELOCITY: number = 0.5;
export const SPIN_FAST_PHASE_RATIO: number = 0.15;
export const SPIN_EASE_EXPONENT: number = 1.4;
export const SPIN_START_DELAY: number = 5;
export const SPIN_END_DELAY: number = 65;
export const DRUMROLL_DELAY_THRESHOLD = 30;

function computeVelocity(progress: number): number {
  if (progress < SPIN_FAST_PHASE_RATIO) return MAX_SPIN_VELOCITY;
  const decelRatio = (progress - SPIN_FAST_PHASE_RATIO) / (1 - SPIN_FAST_PHASE_RATIO);
  return MIN_SPIN_VELOCITY + (MAX_SPIN_VELOCITY - MIN_SPIN_VELOCITY) * Math.pow(1 - decelRatio, SPIN_EASE_EXPONENT);
}

export interface SpinConfig {
  totalSteps: number;
  direction: Direction;
  stepAngle: number;
  segmentCount: number;
  spinToken: string;
  names: string[];
}

function finishSpin(config: SpinConfig): void {
  spinning = false;
  stopDrumRoll();
  playCymbalCrash();
  unlockSpinButtons();
  announceWinner(config.spinToken, resolveWinner(currentRotation, config));
}

export const DRUMROLL_LEAD_IN_STEPS: number = 321;

export interface SpinFrameState {
  distanceTravelled: number;
  readonly sign: number;
}

let spinCancelled = false;

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

export const MIN_SPIN_ROTATIONS: number = 5 * 360;

export function spinWheel(totalSteps: number, direction: Direction, spinToken: string, names: string[]): void {
  spinCancelled = false;
  if (names.length < MIN_ITEMS) {
    spinning = false;
    return;
  }
  spinning = true;

  const clampedSteps = Math.max(Math.floor(totalSteps), MIN_SPIN_ROTATIONS);

  const config: SpinConfig = {
    totalSteps: clampedSteps,
    direction,
    stepAngle: FULL_CIRCLE_DEG / names.length,
    segmentCount: names.length,
    spinToken,
    names,
  };

  animateSpin(config);
}

export async function spinWheelWithRandomSteps(direction: Direction): Promise<void> {
  const names = getNamesInWheelList();
  if (names.length < MIN_ITEMS) return;

  lockSpinButtons();

  try {
    const multiplier = getMultiplier();
    const { ranNum: rawSteps, spinToken } = await fetchRandomNumber(names, currentRotation, direction, multiplier);
    spinWheel(Math.round(MIN_SPIN_ROTATIONS * multiplier) + rawSteps, direction, spinToken, names);
  } catch (error) {
    console.error("[SPIN] Fehler beim Spin:", error);
    unlockSpinButtons();
  }
}

export function resetWheelRotation(): void {
  spinCancelled = true;
  spinning = false;
  currentRotation = 0;
  lastTickRotation = 0;
  updateWheelRotation();
  unlockSpinButtons();
  stopDrumRoll();
}

export function getCurrentRotation(): number {
  return currentRotation;
}

export const resetBtn = requiredElement<HTMLButtonElement>("reset-btn");

export function initWheelControls(): void {
  spinLeftBtn.addEventListener("click", () => {
    void (activeSpinOverride ? activeSpinOverride("left") : spinWheelWithRandomSteps("left"));
  });

  spinRightBtn.addEventListener("click", () => {
    void (activeSpinOverride ? activeSpinOverride("right") : spinWheelWithRandomSteps("right"));
  });

  resetBtn.addEventListener("click", () => {
    (activeResetOverride ?? resetWheelRotation)();
  });
}
