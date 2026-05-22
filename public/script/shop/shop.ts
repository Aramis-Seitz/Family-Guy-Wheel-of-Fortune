import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs, shopGrid } from "../shared/dom.js";
import { fetchUserCoins } from "../profile/profiles.js";
import { Asset, ShopCategory } from "../shared/types.js";

interface User {        // wird später entfernt, nur zum Testen!
    id: string;
    username: string;
    email: string;
    coins: number;
    date_of_birth: Date;
}

const MOCK_USERS: User[] = [     // wird später entfernt, nur zum Testen!
    {
        id: "mock-user-123",
        username: "TestUser",
        email: "test@example.com",
        coins: 67,
        date_of_birth: new Date("2000-01-01"),
    },
    {
        id: "mock-user-456",
        username: "OtherUser",
        email: "other@example.com",
        coins: 200,
        date_of_birth: new Date("1995-05-15"),
    },
];

const MOCK_ASSETS: Asset[] = [     // wird später entfernt, nur zum Testen!
    {
        id: "asset-001",
        name: "Lustige Soundeffekte",
        category: "SOUND",
        price_coins: 50,
        asset_url: "https://example.com/soundpack.jpg",
    },
    {
        id: "asset-002",
        name: "Stewie",
        category: "COMPANION",
        price_coins: 100,
        asset_url: "https://example.com/companion.jpg",
    },
];

const SHOP_CATEGORIES: ShopCategory[] = ["ALL", "SOUNDS", "COMPANIONS"];

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
    return SHOP_CATEGORIES;    // MOCK, später aus Datenbank holen!
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
    shopGrid.appendChild(createAssetCard(MOCK_ASSETS[1]));   // MOCK, später durch echte Daten ersetzen!
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
    //assetIcon.src = asset.asset_url;
    //assetIcon.alt = asset.name;
    return assetIcon;
}

function createAssetFooter(asset: Asset): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "shop-modal__asset-footer";
    assetFooter.appendChild(createAssetTitle(asset));
    assetFooter.appendChild(createAssetBuyButton(asset));

    if (asset.category === "SOUND") {
        assetFooter.appendChild(createPreviewButton());
    }

    return assetFooter;
}

function createAssetTitle(asset: Asset): HTMLElement {
    const title = document.createElement("p");
    title.className = "shop-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createAssetBuyButton(asset: Asset): HTMLElement {
    const assetBuyButton = document.createElement("button");
    assetBuyButton.className = "shop-modal__buy-button";
    assetBuyButton.textContent = `${asset.price_coins} 🪙`;
    return assetBuyButton;
}

function createPreviewButton(): HTMLElement {
    const previewButton = document.createElement("button");
    previewButton.className = "shop-modal__preview-button";
    previewButton.textContent = "▷";
    return previewButton;
}

