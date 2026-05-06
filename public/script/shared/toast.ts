import { ToastType, ToastOptions } from "./types.js";

const toastDurationMs = 3000;
const toastAnimationMs = 300;

function getOrCreateToastContainer(): HTMLDivElement {
  const existing = document.getElementById("toast-container");
  if (existing instanceof HTMLDivElement) return existing;

  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);
  container.showPopover();
  return container;
}

function createToastElement(message: string, type: ToastType): HTMLDivElement {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.textContent = type === "success" ? "✓" : "✕";

  const text = document.createElement("span");
  text.className = "toast__message";
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  return toast;
}

function dismissToast(toast: HTMLDivElement): void {
  toast.classList.remove("toast--visible");
  toast.classList.add("toast--hidden");

  setTimeout(() => toast.remove(), toastAnimationMs);
}

export function showToast({ message, type, durationMs = toastDurationMs }: ToastOptions): void {
  const container = getOrCreateToastContainer();
  const toast = createToastElement(message, type);
  
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  setTimeout(() => dismissToast(toast), durationMs);
}