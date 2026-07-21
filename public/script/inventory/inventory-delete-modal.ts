import { requiredElement, closeOnBackdropClick } from "../shared/dom-helpers";
import { showToast } from "../shared/toast";
import { deleteSavedWheel } from "../api/inventory-api";
import { ApiError } from "../api/api-helpers";
import { loadWheelCards } from "./inventory-wheel-cards";

let pendingDeleteId: string | null = null;

const confirmDeleteName = requiredElement<HTMLElement>("confirm-delete-modal-name");
const confirmDeleteModal = requiredElement<HTMLDialogElement>("confirm-delete-modal");

export function openDeleteModal(id: string, title: string): void {
  pendingDeleteId = id;
  confirmDeleteName.textContent = title;
  confirmDeleteModal.showModal();
}

async function confirmDeleteWheel(): Promise<void> {
  confirmDeleteModal.close();
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  pendingDeleteId = null;

  try {
    await deleteSavedWheel(id);
    loadWheelCards();
    showToast({ message: "Eintrag erfolgreich gelöscht.", type: "success" });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Rad konnte nicht gelöscht werden.";
    showToast({ message, type: "error" });
  }
}

function cancelDelete(): void {
  confirmDeleteModal.close();
  pendingDeleteId = null;
}

const confirmDeleteBtn = requiredElement<HTMLButtonElement>("confirm-delete-modal-confirm-btn");
const cancelDeleteBtn = requiredElement<HTMLButtonElement>("confirm-delete-modal-cancel-btn");

export function initDeleteModal(): void {
  confirmDeleteBtn.addEventListener("click", confirmDeleteWheel);
  cancelDeleteBtn.addEventListener("click", cancelDelete);
  closeOnBackdropClick(confirmDeleteModal, cancelDelete);
}
