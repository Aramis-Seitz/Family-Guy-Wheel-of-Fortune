import { MAX_ITEMS, MIN_ITEMS } from "../shared/constants.js";
import { addBtn, emptyHint, input, list } from "../shared/dom.js";
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

export function lockNameEditing(disableAdd = true): void {
  roomLocked = true;
  disableAddWhileLocked = disableAdd;
  syncAddElements();
  syncRemoveButtons();
}

export function unlockNameEditing(): void {
  roomLocked = false;
  disableAddWhileLocked = false;
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
  btn.addEventListener("click", () => handleRemove(index, li));

  li.appendChild(span);
  li.appendChild(btn);
  return li;
}

function renderNames(names: string[]): void {
  list.replaceChildren(...names.map(createNameItem));
  syncRemoveButtons();
  syncAddElements();
  updateEmptyState();
  refreshWheel();
}

export function updateEmptyState(): void {
  emptyHint.style.display = getSegmentCount() === 0 ? "block" : "none";
}

export function syncRemoveButtons(): void {
  const buttons = list.querySelectorAll(".btn-remove") as NodeListOf<HTMLButtonElement>;
  buttons.forEach((btn) => {
    btn.disabled = roomLocked;
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

function handleRemove(index: number, item: HTMLLIElement): void {
  if (roomLocked) return;
  if (getSegmentCount() <= MIN_ITEMS) {
    shakeItem(item);
    showErrorToast("Mindestens 2 Namen müssen im Rad verbleiben.");
    return;
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
