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
export const companionImage = optionalElement<HTMLImageElement>("companion-image");

export const input = requiredElement<HTMLInputElement>("nameInput");
export const addBtn = requiredElement<HTMLButtonElement>("addBtn");
export const list = requiredElement<HTMLUListElement>("nameList");
export const getRemoveBtn = (): NodeListOf<HTMLButtonElement> =>
  list.querySelectorAll(".btn-remove");
export const errorHint = requiredElement<HTMLParagraphElement>("errorHint");
export const emptyHint = requiredElement<HTMLParagraphElement>("emptyHint");

export const multiplierSlider = requiredElement<HTMLInputElement>("multiplierSlider");
export const multiplierValue = requiredElement<HTMLSpanElement>("multiplierValue");

export const volumeSlider = requiredElement<HTMLInputElement>("volumeSlider");
export const volumeValue = requiredElement<HTMLSpanElement>("volumeValue");
export const volumeIcon = requiredElement<HTMLButtonElement>("volumeIcon");

export const spinLeftBtn = requiredElement<HTMLButtonElement>("spin-left-btn");
export const spinRightBtn = requiredElement<HTMLButtonElement>("spin-right-btn");
export const resetBtn = requiredElement<HTMLButtonElement>("reset-btn");
export const shareBtn = requiredElement<HTMLButtonElement>("shareBtn");

export const inventoryBtn = requiredElement<HTMLButtonElement>("inventoryBtn");
export const inventoryCloseBtn = requiredElement<HTMLButtonElement>("inventoryCloseBtn");
export const inventoryModal = requiredElement<HTMLDialogElement>("inventoryModal");
export const inventoryContent = requiredElement<HTMLDivElement>("inventoryContent");
export const addItemModal = requiredElement<HTMLDialogElement>("addItemModal");
export const inventoryWheelGrid = requiredElement<HTMLElement>("inventoryWheelGrid");
export const addItemInput = requiredElement<HTMLInputElement>("addItemInput");
export const addItemBody = optionalElement<HTMLFormElement>("addItemBody");
export const confirmAddItemBtn = requiredElement<HTMLButtonElement>("confirmAddItemBtn");
export const cancelAddItemBtn = requiredElement<HTMLButtonElement>("cancelAddItemBtn");
export const closeAddItemBtn = requiredElement<HTMLButtonElement>("closeAddItemBtn");
export const confirmDeleteModal = requiredElement<HTMLDialogElement>("confirmDeleteModal");
export const confirmDeleteName = requiredElement<HTMLElement>("confirmDeleteName");
export const confirmDeleteBtn = requiredElement<HTMLButtonElement>("confirmDeleteBtn");
export const cancelDeleteBtn = requiredElement<HTMLButtonElement>("cancelDeleteBtn");
export const inventoryTabs = requiredElement<HTMLElement>("inventory-modal-tabs");
export const inventoryAssetGrid = requiredElement<HTMLElement>("inventoryAssetGrid");

export const shopBtn = requiredElement<HTMLButtonElement>("shopBtn");
export const shopCloseBtn = requiredElement<HTMLButtonElement>("shop-modal-close-btn");
export const shopModal = requiredElement<HTMLDialogElement>("shopModal");
export const shopCoinBalance = requiredElement<HTMLDivElement>("shop-coin-balance");
export const shopTabs = requiredElement<HTMLElement>("shop-modal-tabs");
export const shopGrid = requiredElement<HTMLElement>("shop-modal-grid");

export const winnerModal = requiredElement<HTMLDivElement>("winnerModal");
export const closeWinnerModalBtn = requiredElement<HTMLButtonElement>("closeModal");
export const removeWinnerBtn = requiredElement<HTMLButtonElement>("removeWinner");
export const winnerText = requiredElement<HTMLParagraphElement>("winnerText");
export const confettiCanvas = requiredElement<HTMLCanvasElement>("confettiCanvas");

export const profileName = optionalElement<HTMLSpanElement>("profileName");
export const authButton = optionalElement<HTMLButtonElement>("authButton");
export const coinDisplay = optionalElement<HTMLSpanElement>("coinDisplay");

export const createRoomBtn = optionalElement<HTMLButtonElement>("createRoomBtn");
export const roomKeyInput = optionalElement<HTMLInputElement>("roomKeyInput");
export const joinRoomBtn = optionalElement<HTMLButtonElement>("joinRoomBtn");
export const leaveRoomBtn = optionalElement<HTMLButtonElement>("leaveRoomBtn");
export const copyRoomKeyBtn = optionalElement<HTMLButtonElement>("copyRoomKeyBtn");
export const roomKeyDisplay = optionalElement<HTMLSpanElement>("roomKeyDisplay");
export const roomInfo = optionalElement<HTMLDivElement>("roomInfo");
export const playersList = optionalElement<HTMLUListElement>("playersList");

export const leaveRoomConfirmModal = optionalElement<HTMLDialogElement>("leaveRoomConfirmModal");
export const leaveRoomConfirmMessage = optionalElement<HTMLParagraphElement>("leaveRoomConfirmMessage");
export const confirmLeaveRoomBtn = optionalElement<HTMLButtonElement>("confirmLeaveRoomBtn");
export const cancelLeaveRoomBtn = optionalElement<HTMLButtonElement>("cancelLeaveRoomBtn");

export function closeOnBackdropClick(modal: HTMLDialogElement, onClose?: () => void): void {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      onClose ? onClose() : modal.close();
    }
  });
}