import { MAX_ITEMS, MIN_ITEMS, SPIN_DISABLED_OPACITY } from "../shared/constants.js";
import { addBtn, emptyHint, input, list, spinLeftBtn, spinRightBtn, wheelEmptyHint } from "../shared/dom.js";
import { showToast } from "../shared/toast.js";
import { validateName } from "../shared/validation.js";
import { generateWheel, getSegmentColor } from "../wheel/renderer.js";
import {
  clearNameInputError,
  initNameInputValidation,
  validateNameInput,
} from "./name-input-validation.js";
import { nameState } from "./name-state.js";

let roomLocked = false;
let disableAddWhileLocked = true;
let disableRemoveWhileLocked = true;
let multiplayerMode = false;
let onNameRemoved: ((removedName: string, index: number) => Promise<void> | void) | null = null;

export function setOnNameRemoved(callback: ((removedName: string, index: number) => Promise<void> | void) | null): void {
  onNameRemoved = callback;
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

export function getNames(): string[] {
  return nameState.getNames();
}

export function getSegmentCount(): number {
  return nameState.getCount();
}

export function clearNames(): void {
  nameState.clear();
}

function getInitialNamesFromMarkup(): string[] {
  return Array.from(list.querySelectorAll(".name-text"))
    .map((element) => element.textContent?.trim() ?? "")
    .filter((name) => validateName(name).valid);
}

function createNameItem(name: string, index: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "name-item";
  li.style.backgroundColor = getSegmentColor(index);

  const span = document.createElement("span");
  span.className = "name-text";
  span.textContent = name;

  const btn = document.createElement("button");
  btn.className = "btn-remove";
  btn.type = "button";
  btn.textContent = "-";
  btn.addEventListener("click", async () => {
    await handleRemove(index, li);
  });

  li.appendChild(span);
  li.appendChild(btn);
  return li;
}

function renderNames(names: string[]): void {
  list.replaceChildren(...names.map(createNameItem));
  syncRemoveButtons();
  syncAddElements();
  updateEmptyState();
  if (!multiplayerMode) {
    updateSpinButtonState();
  }
  refreshWheel();
}

export function updateEmptyState(): void {
  emptyHint.style.display = getSegmentCount() === 0 ? "block" : "none";
  if (wheelEmptyHint) {
    wheelEmptyHint.classList.toggle("hidden", getSegmentCount() > 0);
  }
}

function updateSpinButtonState(): void {
  const disabled = getSegmentCount() < MIN_ITEMS;
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
  const buttons = list.querySelectorAll(".btn-remove") as NodeListOf<HTMLButtonElement>;
  const disabled = roomLocked && disableRemoveWhileLocked;
  buttons.forEach((btn) => {
    btn.disabled = disabled;
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
    btn.style.opacity = disabled ? "0.5" : "1";
  });
}

export function syncAddElements(): void {
  const disabled = (roomLocked && disableAddWhileLocked) || getSegmentCount() >= MAX_ITEMS;

  addBtn.disabled = disabled;
  input.disabled = disabled;

  addBtn.style.opacity = disabled ? "0.5" : "1";
  addBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  input.style.opacity = disabled ? "0.5" : "1";
  input.style.cursor = disabled ? "not-allowed" : "text";
}

export function setMultiplayerMode(active: boolean): void {
  multiplayerMode = active;
  if (!active) {
    updateSpinButtonState();
  }
}

function showErrorToast(message: string): void {
  showToast({
    message: `${message}`,
    type: "error"
  });
}

export function refreshWheel(): void {
  generateWheel(getNames());
}

function shakeItem(item: HTMLLIElement): void {
  item.classList.remove("shake");
  void item.offsetWidth;
  item.classList.add("shake");
  item.addEventListener("animationend", () => item.classList.remove("shake"), { once: true });
}

async function handleRemove(index: number, item: HTMLLIElement): Promise<void> {
  if (roomLocked && disableRemoveWhileLocked) return;

  const nameText = item.querySelector(".name-text")?.textContent?.trim() ?? "";
  if (onNameRemoved && nameText) {
    const button = item.querySelector(".btn-remove") as HTMLButtonElement | null;
    if (button) button.disabled = true;
    try {
      await onNameRemoved(nameText, index);
    } catch (error) {
      if (button) button.disabled = false;
      console.error("Failed to remove name from room wheel items:", error);
      return;
    }
  }

  nameState.removeAt(index);
}

export function addName(rawName: string): void {
  if (roomLocked) return;
  const validation = validateNameInput(rawName);

  if (!validation.valid) {
    input.focus();
    return;
  }

  if (!nameState.addName(validation.value)) {
    showErrorToast(`Maximal ${MAX_ITEMS} Einträge erlaubt.`);
    return;
  }

  input.value = "";
  clearNameInputError();
  input.focus();
}

export function removeNameByIndex(index: number): void {
  const item = list.querySelectorAll(".name-item")[index] as HTMLLIElement | undefined;

  if (item) {
    handleRemove(index, item);
  }
}

export function replaceNames(names: string[]): void {
  const validNames = names
    .map((name) => validateName(name))
    .filter((result): result is { valid: true; value: string } => result.valid)
    .map((result) => result.value);

  nameState.setNames(validNames);
}

export function initNameList(): void {
  const initialNames = getInitialNamesFromMarkup();

  nameState.subscribe(renderNames);
  nameState.setNames(initialNames);
  initNameInputValidation();
}

export function initExistingItems(): void {
  initNameList();
}
