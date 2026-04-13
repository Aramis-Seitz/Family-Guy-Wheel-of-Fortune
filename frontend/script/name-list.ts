import { MIN_ITEMS } from "./constants.js";
import { list, input, errorHint, emptyHint } from "./dom.js";
import { generateWheel, getSegmentColor } from "./wheel-renderer.js";

// --- Getters ---

export function getNames(): string[] {
  return Array.from(list.querySelectorAll(".name-text"))
    .map((element) => element.textContent?.trim() || "")
    .filter((name) => name.length > 0);
}

export function getSegmentCount(): number {
  return getNames().length;
}

function getItemCount(): number {
  return list.querySelectorAll(".name-item").length;
}

// --- UI Updates ---

function applyItemColor(item: HTMLLIElement, index: number): void {
  item.style.backgroundColor = getSegmentColor(index);
}

function updateListColors(): void {
  const items = list.querySelectorAll(".name-item") as NodeListOf<HTMLLIElement>;
  items.forEach((item, index) => {
    applyItemColor(item, index);
  });
}

export function updateEmptyState(): void {
  emptyHint.style.display = getItemCount() === 0 ? "block" : "none";
}

export function syncRemoveButtons(): void {
  const tooFew = getItemCount() <= MIN_ITEMS;
  const buttons = list.querySelectorAll(".btn-remove") as NodeListOf<HTMLButtonElement>;
  buttons.forEach((btn) => {
    btn.disabled = tooFew;
  });
}

// --- Error Handling ---

let errorTimer: ReturnType<typeof setTimeout> | null = null;

function showError(): void {
  errorHint.classList.remove("hidden");
  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => errorHint.classList.add("hidden"), 2000);
}

// --- Refresh ---

function refreshWheel(): void {
  updateListColors();
  generateWheel(getNames());
}

// --- Add / Remove ---

function handleRemove(item: HTMLLIElement): void {
  if (getItemCount() <= MIN_ITEMS) {
    item.classList.remove("shake");
    void item.offsetWidth;
    item.classList.add("shake");
    item.addEventListener("animationend", () => item.classList.remove("shake"), { once: true });
    showError();
    return;
  }
  item.remove();
  updateEmptyState();
  syncRemoveButtons();
  refreshWheel();
}

function attachRemoveListener(btn: HTMLButtonElement, item: HTMLLIElement): void {
  btn.addEventListener("click", () => handleRemove(item));
}

export function addName(rawName: string): void {
  const name = rawName.trim();
  if (!name) return;

  const li = document.createElement("li") as HTMLLIElement;
  li.className = "name-item";

  const span = document.createElement("span");
  span.className = "name-text";
  span.textContent = name;

  const btn = document.createElement("button") as HTMLButtonElement;
  btn.className = "btn-remove";
  btn.textContent = "−";
  attachRemoveListener(btn, li);

  li.appendChild(span);
  li.appendChild(btn);
  list.appendChild(li);

  updateEmptyState();
  syncRemoveButtons();
  refreshWheel();
  input.value = "";
  input.focus();
}

export function initExistingItems(): void {
  const items = list.querySelectorAll(".name-item") as NodeListOf<HTMLLIElement>;
  items.forEach((item) => {
    const btn = item.querySelector(".btn-remove") as HTMLButtonElement | null;
    if (btn) {
      attachRemoveListener(btn, item);
    }
  });
}

export { refreshWheel };
