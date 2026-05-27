import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs, shopGrid } from "../shared/dom.js";
import { fetchUserCoins } from "../profile/profiles.js";
import { Asset, AssetCategory } from "../shared/types.js";
import { MOCK_ASSETS } from "./shop-mock-data.js";
import { MOCK_ASSET_CATEGORIES } from "../shared/constants.js";


// ----- SHOP-MODAL ÖFFNEN/SCHLIESSEN -----

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


// ----- COIN BALANCE -----

const balance = await fetchUserCoins();

function renderCoinBalance(balance: number) {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`
}

async function loadCoinBalance(): Promise<void> {
    renderCoinBalance(balance);
}


// ----- ASSET ERSTELLEN UND LADEN -----

function loadShopAssets(): void {
    shopGrid.innerHTML = "";
    const activeTab = shopTabs.querySelector(".shop-modal__tab--active") as HTMLElement;
    let activeCategory = getClickedCategory(activeTab) || "ALL";
    let filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => shopGrid.appendChild(createAssetCard(asset)));
}

function createAssetCard(asset: Asset): HTMLElement {
    const assetCard = document.createElement("div");
    assetCard.className = "shop-modal__asset-card";
    assetCard.appendChild(createAssetHeader(asset));
    assetCard.appendChild(createAssetFooter(asset));

    if (balance < asset.price_coins) {
        assetCard.classList.add("shop-modal__asset-card__too-expensive");
    } else {
        assetCard.classList.remove("shop-modal__asset-card__too-expensive");
    }

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

// ----- CATEGORY-TABS UND FILTER-FUNKTIONALITÄT -----

function createShopTabButton(category: AssetCategory | "ALL"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "shop-modal__tab";
    button.dataset.category = category;
    button.textContent = category === "ALL" ? "ALL" : `${category}s`.toUpperCase();

    if (category === "ALL") button.classList.add("shop-modal__tab--active");

    button.onclick = () => {
        shopTabs.querySelectorAll(".shop-modal__tab").forEach(btn => btn.classList.remove("shop-modal__tab--active"));
        button.classList.add("shop-modal__tab--active");
        loadShopAssets();
    };
    return button;
}

function renderShopTabs(categories: (AssetCategory | "ALL")[]): void {
    shopTabs.innerHTML = "";
    categories.forEach(category => {
        const button = createShopTabButton(category);
        shopTabs.appendChild(button);
    });
}

async function loadShopTabs(): Promise<void> {
    const categories = ["ALL", ...fetchAssetCategories()];
    renderShopTabs(categories as AssetCategory[]);
}

function fetchAssetCategories(): AssetCategory[] {
    // Kategorien in Großbuchstaben zurückgeben, damit sie zu den Asset-Kategorien passen
    return MOCK_ASSET_CATEGORIES.map(category => category.toUpperCase()) as AssetCategory[];
}

function getClickedCategory(target: HTMLElement): AssetCategory | "ALL" | null {
    if (target && target.tagName === "BUTTON" && target.dataset.category) {
        return target.dataset.category as AssetCategory | "ALL";
    }
    return null;
}

function filterAssetsByCategory(category: AssetCategory | "ALL"): Asset[] {
    return category === "ALL"
        ? MOCK_ASSETS
        : MOCK_ASSETS.filter(asset => asset.category === category);
}