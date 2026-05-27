import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs, shopGrid } from "../shared/dom.js";
import { fetchUserCoins } from "../profile/profiles.js";
import { Asset, ShopCategory } from "../shared/types.js";
import { MOCK_ASSETS, MOCK_SHOP_CATEGORIES } from "./shop-mock-data.js";

async function openShop(): Promise<void> {
    shopModal.showModal();
    await loadShop();
}

function closeShop(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
}

async function loadShop(): Promise<void> {
    await loadCoinBalance();
    await loadShopTabs();
    await loadShopAssets();
}

function renderCoinBalance(balance: number) {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`
}

async function loadCoinBalance(): Promise<void> {
    const balance = await fetchUserCoins();
    renderCoinBalance(balance);
}

function fetchShopCategories(): ShopCategory[] {
    return MOCK_SHOP_CATEGORIES;
}

function renderShopTabs(categories: ShopCategory[]): void {
    shopTabs.innerHTML = "";

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "shop-modal__tab";
        button.dataset.category = category;
        button.textContent = category;
        shopTabs.appendChild(button);
    })
}

async function loadShopTabs(): Promise<void> {
    const categories = await fetchShopCategories();
    renderShopTabs(categories);
}

// ----- ASSET-KACHELN UND KAUFEN -----

function loadShopAssets(): void {
    shopGrid.innerHTML = "";
    MOCK_ASSETS.forEach(asset => shopGrid.appendChild(createAssetCard(asset)));
}

function createAssetCard(asset: Asset): HTMLElement {
    const assetCard = document.createElement("div");
    assetCard.className = "shop-modal__asset-card";
    assetCard.appendChild(createAssetHeader(asset));
    assetCard.appendChild(createAssetFooter(asset));
    return assetCard;
}

function createAssetHeader(asset: Asset): HTMLElement {
    const assetHeader = document.createElement("div");
    assetHeader.className = "shop-modal__asset-header";
    assetHeader.appendChild(createAssetIcon(asset));
    return assetHeader;
}

function createAssetIcon(asset: Asset): HTMLElement {
    const assetIcon = document.createElement("img");
    assetIcon.className = "shop-modal__asset-icon";
    assetIcon.src = asset.asset_url;
    assetIcon.alt = asset.name;
    return assetIcon;
}

function createAssetFooter(asset: Asset): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "shop-modal__asset-footer";
    assetFooter.appendChild(createAssetDetailsRow(asset));
    assetFooter.appendChild(createAssetBuyButton(asset));
    return assetFooter;
}

function createAssetDetailsRow(asset: Asset): HTMLElement {
    const detailsRow = document.createElement("div");
    detailsRow.className = "shop-modal__asset-details-row";
    detailsRow.appendChild(createAssetTitle(asset));

    if (asset.category === "SOUND") {
        detailsRow.appendChild(createPreviewButton());
    }

    return detailsRow;
}

function createAssetTitle(asset: Asset): HTMLElement {
    const title = document.createElement("p");
    title.className = "shop-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createPreviewButton(): HTMLElement {
    const previewButton = document.createElement("button");
    previewButton.className = "shop-modal__preview-btn";
    previewButton.textContent = "▷";
    return previewButton;
}

function createAssetBuyButton(asset: Asset): HTMLElement {
    const assetBuyButton = document.createElement("button");
    assetBuyButton.className = "shop-modal__buy-btn";
    assetBuyButton.textContent = `${asset.price_coins} 🪙`;
    return assetBuyButton;
}