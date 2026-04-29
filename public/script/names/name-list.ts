import { MAX_ITEMS, MIN_ITEMS } from "../shared/constants.js";
import { addBtn, emptyHint, errorHint, input, list } from "../shared/dom.js";
import { validateName } from "../shared/validation.js";
import { generateWheel, getSegmentColor } from "../wheel/renderer.js";
import { nameState } from "./name-state.js";

let errorTimer: ReturnType<typeof setTimeout> | null = null;

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
  const tooFew = getSegmentCount() <= MIN_ITEMS;
  const buttons = list.querySelectorAll(".btn-remove") as NodeListOf<HTMLButtonElement>;

  buttons.forEach((btn) => {
    btn.disabled = tooFew;
  });
}

export function syncAddElements(): void {
  const tooMany = getSegmentCount() >= MAX_ITEMS;

  addBtn.disabled = tooMany;
  input.disabled = tooMany;

  addBtn.style.opacity = tooMany ? "0.5" : "1";
  addBtn.style.cursor = tooMany ? "not-allowed" : "pointer";
  input.style.opacity = tooMany ? "0.5" : "1";
  input.style.cursor = tooMany ? "not-allowed" : "text";
}

function showError(message = "At least 2 entries required."): void {
  errorHint.textContent = message;
  errorHint.classList.remove("hidden");

  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => errorHint.classList.add("hidden"), 2000);
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
  if (getSegmentCount() <= MIN_ITEMS) {
    shakeItem(item);
    showError();
    return;
  }

  nameState.removeAt(index);
}

export function addName(rawName: string): void {
  input.classList.remove("invalid");

  const validation = validateName(rawName);

  if (!validation.valid) {
    input.classList.add("invalid");
    input.focus();
    showError(validation.message);
    return;
  }

  if (!nameState.addName(validation.value)) {
    showError(`Maximal ${MAX_ITEMS} Eintraege erlaubt.`);
    return;
  }

  input.value = "";
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
}

export function initExistingItems(): void {
  initNameList();
}
