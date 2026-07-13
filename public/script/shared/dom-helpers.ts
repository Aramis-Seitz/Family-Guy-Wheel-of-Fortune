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
