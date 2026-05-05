function requiredElement<T extends HTMLElement | SVGElement>(id: string): T {
  const element = document.getElementById(id) as T | null;

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

function optionalElement<T extends HTMLElement | SVGElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export const wheelElement = requiredElement<SVGGElement>("wheel");
export const tickSoundTemplate = optionalElement<HTMLAudioElement>("tickSound");
export const drumrollAudio = optionalElement<HTMLAudioElement>("drumroll");
export const cymbalCrashAudio = optionalElement<HTMLAudioElement>("cymbal-crash");

export const input = requiredElement<HTMLInputElement>("nameInput");
export const addBtn = requiredElement<HTMLButtonElement>("addBtn");
export const list = requiredElement<HTMLUListElement>("nameList");
export const getRemoveBtn = (): NodeListOf<HTMLButtonElement> =>
  list.querySelectorAll(".btn-remove");
export const errorHint = requiredElement<HTMLParagraphElement>("errorHint");
export const emptyHint = requiredElement<HTMLParagraphElement>("emptyHint");

export const multiplierSlider = requiredElement<HTMLInputElement>("multiplierSlider");
export const multiplierValue = requiredElement<HTMLSpanElement>("multiplierValue");
export const spinLeftBtn = requiredElement<HTMLButtonElement>("spin-left-btn");
export const spinRightBtn = requiredElement<HTMLButtonElement>("spin-right-btn");
export const resetBtn = requiredElement<HTMLButtonElement>("reset-btn");
export const shareBtn = requiredElement<HTMLButtonElement>("shareBtn");

export const inventoryBtn = requiredElement<HTMLButtonElement>("inventoryBtn");
export const inventoryCloseBtn = requiredElement<HTMLButtonElement>("inventoryCloseBtn");
export const inventoryModal = requiredElement<HTMLDialogElement>("inventoryModal");
export const inventoryContent = requiredElement<HTMLDivElement>("inventoryContent");
export const addItemModal = requiredElement<HTMLDialogElement>("addItemModal");
export const inventoryGrid = document.querySelector(".inventory-grid") as HTMLElement;
export const addItemInput = requiredElement<HTMLInputElement>("addItemInput");
export const addItemBody = optionalElement<HTMLFormElement>("addItemBody");
export const confirmAddItemBtn = requiredElement<HTMLButtonElement>("confirmAddItemBtn");
export const cancelAddItemBtn = requiredElement<HTMLButtonElement>("cancelAddItemBtn");
export const closeAddItemBtn = requiredElement<HTMLButtonElement>("closeAddItemBtn");
export const confirmDeleteModal = requiredElement<HTMLDialogElement>("confirmDeleteModal");
export const confirmDeleteName = requiredElement<HTMLElement>("confirmDeleteName");
export const confirmDeleteBtn = requiredElement<HTMLButtonElement>("confirmDeleteBtn");
export const cancelDeleteBtn = requiredElement<HTMLButtonElement>("cancelDeleteBtn");

export const profileName = optionalElement<HTMLSpanElement>("profileName");
export const authButton = optionalElement<HTMLButtonElement>("authButton");
export const coinDisplay = optionalElement<HTMLSpanElement>("coinDisplay");

export function closeOnBackdropClick(modal: HTMLDialogElement, onClose?: () => void): void {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      onClose ? onClose() : modal.close();
    }
  });
}