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
import { nameState, NameEntry } from "./name-state.js";

let roomLocked = false;
let protectedNames = new Set<string>();

export function lockNameEditing(): void {
  roomLocked = true;
  syncListButtons();
  syncAddElements();
}

export function unlockNameEditing(): void {
  roomLocked = false;
  syncListButtons();
  syncAddElements();
}

export function isNameEditingLocked(): boolean {
  return roomLocked;
}

export function setProtectedNames(names: string[]): void {
  protectedNames = new Set(names.filter((name) => name.trim().length > 0));
  syncListButtons();
}

function isProtectedName(name: string): boolean {
  return protectedNames.has(name);
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

function createNameItem(entry: NameEntry, index: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "name-item";
  if (!entry.active) {
    li.classList.add("inactive");
  }
  li.style.backgroundColor = getSegmentColor(index);

  const span = document.createElement("span");
  span.className = "name-text";
  span.textContent = entry.value;

  const btnToggle = document.createElement("button");
  btnToggle.className = "btn-toggle";
  btnToggle.type = "button";
  btnToggle.textContent = entry.active ? "−" : "+";
  btnToggle.title = entry.active ? "Aus dem Rad entfernen" : "Wieder ins Rad hinzufügen";
  btnToggle.addEventListener("click", () => handleToggle(index, li));

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn-delete";
  btnDelete.type = "button";
  btnDelete.textContent = "🗑";
  btnDelete.title = "Aus der Liste löschen";
  btnDelete.dataset.name = entry.value;
  btnDelete.disabled = roomLocked || isProtectedName(entry.value);
  btnDelete.addEventListener("click", () => handleDelete(index, li));

  li.appendChild(span);
  li.appendChild(btnToggle);
  li.appendChild(btnDelete);
  return li;
}

function renderNames(entries: NameEntry[]): void {
  list.replaceChildren(...entries.map(createNameItem));
  syncListButtons();
  syncAddElements();
  updateEmptyState();
  refreshWheel();
}

export function updateEmptyState(): void {
  emptyHint.style.display = getSegmentCount() === 0 ? "block" : "none";
}

export function syncListButtons(): void {
  const toggleButtons = list.querySelectorAll(".btn-toggle") as NodeListOf<HTMLButtonElement>;
  const deleteButtons = list.querySelectorAll(".btn-delete") as NodeListOf<HTMLButtonElement>;

  toggleButtons.forEach((btn) => {
    btn.disabled = roomLocked;
  });

  deleteButtons.forEach((btn) => {
    const name = btn.dataset.name ?? "";
    btn.disabled = roomLocked || isProtectedName(name);
  });
}

export function syncAddElements(): void {
  const disabled = roomLocked || getSegmentCount() >= MAX_ITEMS;

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

function handleToggle(index: number, item: HTMLLIElement): void {
  if (roomLocked) return;
  if (!nameState.toggleActiveAt(index)) {
    shakeItem(item);
    showErrorToast("Mindestens 2 Namen müssen im Rad verbleiben.");
    return;
  }
}

function handleDelete(index: number, item: HTMLLIElement): void {
  if (roomLocked) return;

  const entry = nameState.getEntries()[index];
  if (!entry) return;

  if (isProtectedName(entry.value)) {
    shakeItem(item);
    showErrorToast("Spieler in der Lobby kann nicht gelöscht werden.");
    return;
  }

  if (entry.active && nameState.getActiveCount() <= MIN_ITEMS) {
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
    handleDelete(index, item);
  }
}

export function deactivateNameByIndex(index: number): void {
  const item = list.querySelectorAll(".name-item")[index] as HTMLLIElement | undefined;
  if (item) {
    handleToggle(index, item);
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
