import { shopBtn, shopModal, shopContent, shopCloseBtn, closeOnBackdropClick } from "../shared/dom.js";

export function createShopModal(): HTMLDialogElement {
    const dialog = document.createElement("dialog");
    dialog.className = "shop-modal";

    const content = document.createElement("div");
    content.className = "shop-content";

    const header = document.createElement("header");
    header.className = "shop-modal__header";

    const title = document.createElement("h2");
    title.className = "shop-modal__title";
    title.textContent = "Shop";

    const coinsDisplay = document.createElement("span");
    coinsDisplay.className = "shop-modal__coins";
    coinsDisplay.textContent = `CoinsBalance🪙`

    const closeBtn = document.createElement("button");
    closeBtn.className = "shop-modal__close";
    closeBtn.textContent = "✕";

    header.append(title, closeBtn);
    content.appendChild(header);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    return dialog;
}

function openShopModal(): void {
    shopModal.showModal();
}

function closeShopModal(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShopModal)
    shopCloseBtn.addEventListener("click", closeShopModal);
    closeOnBackdropClick(shopModal, closeShopModal);
}