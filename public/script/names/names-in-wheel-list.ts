import { SPIN_DISABLED_OPACITY, spinLeftBtn, spinRightBtn } from "../wheel/spin";
import { wheelEmptyHint } from "../room";
import { requiredElement } from "../shared/dom-helpers";
import { showToast } from "../shared/toast";
import { validateName } from "../shared/validation";
import { generateWheel, getSegmentColor } from "../wheel/renderer";
import {
  clearNameInputError,
  initNameInputValidation,
  validateNameInput,
} from "./name-input-validation";
import { namesInWheelListState, MAX_ITEMS, MIN_ITEMS } from "./names-in-wheel-list-state";

let roomLocked = false;
let disableAddWhileLocked = true;
let disableRemoveWhileLocked = true;
let onNameInWheelListRemoved: ((removedName: string, index: number) => Promise<void> | void) | null = null;

export function setOnNameInWheelListRemoved(callback: ((removedName: string, index: number) => Promise<void> | void) | null): void {
  onNameInWheelListRemoved = callback;
}

export function lockNameEditing(disableAdd = true, disableRemove = true): void {
  roomLocked = true;
  disableAddWhileLocked = disableAdd;
  disableRemoveWhileLocked = disableRemove;
  syncAddElements();
  syncRemoveButtons();
}

export function unlockNameEditing(): void {
  roomLocked = false;
  disableAddWhileLocked = false;
  disableRemoveWhileLocked = false;
  syncAddElements();
  syncRemoveButtons();
}

export function isNameEditingLocked(): boolean {
  return roomLocked;
}

export function getNamesInWheelList(): string[] {
  return namesInWheelListState.getNamesInWheelList();
}

export function getSegmentCountOfWheelList(): number {
  return namesInWheelListState.getCountOfNamesInWheelList();
}

export function clearNamesInWheelList(): void {
  namesInWheelListState.clearNamesInWheelList();
}

export const list = requiredElement<HTMLUListElement>("names-in-wheel-list");
export const getRemoveBtn = (): NodeListOf<HTMLButtonElement> =>
  list.querySelectorAll(".names-in-wheel-list-element__remove-btn");

function getInitialNamesInWheelListFromMarkup(): string[] {
  return Array.from(list.querySelectorAll(".names-in-wheel-list-element__text"))
    .map((element) => element.textContent?.trim() ?? "")
    .filter((name) => validateName(name).valid);
}

function createNamesinWheelListElement(name: string, index: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "names-in-wheel-list-element";
  li.style.backgroundColor = getSegmentColor(index);

  const span = document.createElement("span");
  span.className = "names-in-wheel-list-element__text";
  span.textContent = name;

  const btn = document.createElement("button");
  btn.className = "names-in-wheel-list-element__remove-btn";
  btn.type = "button";
  btn.textContent = "-";
  btn.addEventListener("click", async () => {
    await handleRemoveNameElementFromWheelList(index, li);
  });

  li.appendChild(span);
  li.appendChild(btn);
  return li;
}

function renderNamesInWheelList(names: string[]): void {
  list.replaceChildren(...names.map(createNamesinWheelListElement));
  syncRemoveButtons();
  syncAddElements();
  updateEmptyState();
  updateSpinButtonState();
  refreshWheel();
}

export const emptyHint = requiredElement<HTMLParagraphElement>("name-empty-hint");

export function updateEmptyState(): void {
  emptyHint.style.display = getSegmentCountOfWheelList() === 0 ? "block" : "none";
  if (wheelEmptyHint) {
    wheelEmptyHint.classList.toggle("hidden", getSegmentCountOfWheelList() > 0);
  }
}

function updateSpinButtonState(): void {
  const disabled = getSegmentCountOfWheelList() < MIN_ITEMS;
  [spinLeftBtn, spinRightBtn].forEach((btn) => {
    btn.disabled = disabled;
    if (disabled) {
      btn.style.setProperty("opacity", SPIN_DISABLED_OPACITY);
      btn.style.setProperty("cursor", "not-allowed");
      btn.style.setProperty("pointer-events", "none");
    } else {
      btn.style.removeProperty("opacity");
      btn.style.removeProperty("cursor");
      btn.style.removeProperty("pointer-events");
    }
  });
}

export function syncRemoveButtons(): void {
  const buttons = list.querySelectorAll(".names-in-wheel-list-element__remove-btn") as NodeListOf<HTMLButtonElement>;
  const disabled = roomLocked && disableRemoveWhileLocked;
  buttons.forEach((btn) => {
    btn.disabled = disabled;
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
    btn.style.opacity = disabled ? "0.5" : "1";
  });
}

export const input = requiredElement<HTMLInputElement>("name-input");
export const addBtn = requiredElement<HTMLButtonElement>("add-name-btn");

export function syncAddElements(): void {
  const disabled = (roomLocked && disableAddWhileLocked) || getSegmentCountOfWheelList() >= MAX_ITEMS;

  addBtn.disabled = disabled;
  input.disabled = disabled;

  addBtn.style.opacity = disabled ? "0.5" : "1";
  addBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  input.style.opacity = disabled ? "0.5" : "1";
  input.style.cursor = disabled ? "not-allowed" : "text";
}

function showErrorToast(message: string): void {
  showToast({
    message: `${message}`,
    type: "error"
  });
}

export function refreshWheel(): void {
  generateWheel(getNamesInWheelList());
}

async function handleRemoveNameElementFromWheelList(index: number, wheelListNameElement: HTMLLIElement): Promise<void> {
  if (roomLocked && disableRemoveWhileLocked) return;

  const nameText = wheelListNameElement.querySelector(".names-in-wheel-list-element__text")?.textContent?.trim() ?? "";
  if (onNameInWheelListRemoved && nameText) {
    const button = wheelListNameElement.querySelector(".names-in-wheel-list-element__remove-btn") as HTMLButtonElement | null;
    if (button) button.disabled = true;
    try {
      await onNameInWheelListRemoved(nameText, index);
    } catch (error) {
      if (button) button.disabled = false;
      console.error("Failed to remove name from room wheel names:", error);
      return;
    }
  }

  namesInWheelListState.removeNameInWheelListAt(index);
}

export function addNameToList(rawName: string): void {
  if (roomLocked) return;
  const validation = validateNameInput(rawName);

  if (!validation.valid) {
    input.focus();
    return;
  }

  if (!namesInWheelListState.addNameToWheelList(validation.value)) {
    showErrorToast(`Maximal ${MAX_ITEMS} Einträge erlaubt.`);
    return;
  }

  input.value = "";
  clearNameInputError();
  input.focus();
}

export function removeNameFromListByIndex(index: number): void {
  const item = list.querySelectorAll(".names-in-wheel-list-element")[index] as HTMLLIElement | undefined;

  if (item) {
    handleRemoveNameElementFromWheelList(index, item);
  }
}

export function replaceNames(names: string[]): void {
  const validNames = names
    .map((name) => validateName(name))
    .filter((result): result is { valid: true; value: string } => result.valid)
    .map((result) => result.value);

  namesInWheelListState.setNamesInWheelList(validNames);
}

export function initNamesInWheelList(): void {
  const initialNames = getInitialNamesInWheelListFromMarkup();

  namesInWheelListState.subscribe(renderNamesInWheelList);
  namesInWheelListState.setNamesInWheelList(initialNames);
  initNameInputValidation();
}

export function initExistingNamesInWheelList(): void {
  initNamesInWheelList();
}
