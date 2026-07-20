import { requiredElement, closeOnBackdropClick } from "../shared/dom-helpers";
import { generateShareLink } from "../names/share-names-in-wheel-list";
import { showToast } from "../shared/toast";
import { saveSavedWheels } from "../api/inventory-api";
import { ApiError } from "../api/api-helpers";
import { loadWheelCards } from "./inventory-wheel-cards";
import { inventoryModal } from "./inventory";

const saveWheelInput = requiredElement<HTMLInputElement>("save-wheel-input");
const saveWheelModal = requiredElement<HTMLDialogElement>("save-wheel-modal");
const confirmSaveWheelBtn = requiredElement<HTMLButtonElement>("save-wheel-modal-confirm-btn");
const cancelSaveWheelBtn = requiredElement<HTMLButtonElement>("save-wheel-modal-cancel-btn");
const closeSaveWheelBtn = requiredElement<HTMLButtonElement>("save-wheel-modal-close-btn");

export function openSaveWheelModal(): void {
  if (!inventoryModal.open) return;

  saveWheelInput.value = "";
  saveWheelModal.showModal();

  setTimeout(() => saveWheelInput.focus(), 60);
}

function closeSaveWheelModal(): void {
  saveWheelModal.close();
}

async function submitSavedWheel(): Promise<void> {
  const name = saveWheelInput.value.trim();
  if (!name) {
    saveWheelInput.focus();
    return;
  }

  try {
    await saveSavedWheels(name, generateShareLink());
    closeSaveWheelModal();
    loadWheelCards();
    showToast({
      message: `"${name}" wurde erfolgreich gespeichert.`,
      type: "success"
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Speichern fehlgeschlagen. Bitte versuche es erneut.";
    showToast({ message, type: "error" });
  }
}

export function initSaveWheelModal(): void {
  confirmSaveWheelBtn.addEventListener("click", submitSavedWheel);
  cancelSaveWheelBtn.addEventListener("click", closeSaveWheelModal);
  closeSaveWheelBtn.addEventListener("click", closeSaveWheelModal);
  saveWheelInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSavedWheel();
    }
  });
  closeOnBackdropClick(saveWheelModal, closeSaveWheelModal);
}
