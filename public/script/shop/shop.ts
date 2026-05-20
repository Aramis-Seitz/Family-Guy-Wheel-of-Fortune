import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal } from "../shared/dom.js";

function openShop(): void {
    shopModal.showModal();
}

function closeShop(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
}

