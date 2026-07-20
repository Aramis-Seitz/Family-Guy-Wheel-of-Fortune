export function requiredElement<T extends HTMLElement | SVGElement>(id: string): T {
  const element = document.getElementById(id) as T | null;

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function optionalElement<T extends HTMLElement | SVGElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function closeOnBackdropClick(modal: HTMLDialogElement, onClose?: () => void): void {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      onClose ? onClose() : modal.close();
    }
  });
}

export function onActivate(element: HTMLElement, handler: () => void): void {
  element.addEventListener("click", handler);
  element.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  });
}

export function initToggleModal(
  modal: HTMLDialogElement,
  openBtn: HTMLElement,
  closeBtn: HTMLElement,
  onOpen: () => void
): void {
  openBtn.addEventListener("click", onOpen);
  closeBtn.addEventListener("click", () => modal.close());
  closeOnBackdropClick(modal);
}
