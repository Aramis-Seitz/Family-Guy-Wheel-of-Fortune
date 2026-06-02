import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs, shopGrid } from "../shared/dom.js";
import { fetchUserCoins } from "../profile/profiles.js";
import { Asset, AssetCategory } from "../shared/types.js";
import { ASSET_CATEGORIES } from "../shared/constants.js";
import { getOwnedAssetIds, getShopAssets, purchaseAsset } from "../api/shop.js";
import { showToast } from "../shared/toast.js";


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
    await loadOwnedAssets();
    await loadShopAssets();
}


// ----- COIN BALANCE -----

let balance = await fetchUserCoins();

function renderCoinBalance(newBalance: number) {
    balance = newBalance;
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`
}

async function loadCoinBalance(): Promise<void> {
    renderCoinBalance(balance);
}


// ----- ASSET ERSTELLEN UND LADEN -----

let currentAssets: Asset[] = await getShopAssets();

let currentOwnedAssetIds: string[] = [];

/**
 * Checks if an asset is owned by the user
 * @param assetId - The ID of the asset to check
 * @returns true if owned, false otherwise
 */
function isAssetOwned(assetId: string): boolean {
    return currentOwnedAssetIds.includes(assetId);
}

function loadShopAssets(): void {
    shopGrid.innerHTML = "";
    const activeTab = shopTabs.querySelector(".shop-modal__tab--active") as HTMLElement;
    let activeCategory = getClickedCategory(activeTab) || "ALL";
    let filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => shopGrid.appendChild(createAssetCard(asset)));
}

async function loadOwnedAssets(): Promise<void> {
    try {
        currentOwnedAssetIds = await getOwnedAssetIds();
        console.log("✅ Owned asset IDs loaded:", currentOwnedAssetIds.length, "assets", currentOwnedAssetIds);
    } catch (error) {
        console.error("Failed to load owned asset IDs:", error);
        showToast({
            message: "Fehler beim Laden des Inventars",
            type: "error"
        });
    }
}

function createAssetCard(asset: Asset): HTMLElement {
    const assetCard = document.createElement("div");
    const owned = isAssetOwned(asset.id);
    const tooExpensive = balance < asset.price_coins;

    assetCard.className = "shop-modal__asset-card";
    assetCard.appendChild(createAssetHeader(asset));
    assetCard.appendChild(createAssetFooter(asset));

    if (!owned && tooExpensive) {
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

    if (asset.category === "sound") {
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
    const owned = isAssetOwned(asset.id);
    const tooExpensive = balance < asset.price_coins;

    assetBuyButton.className = "shop-modal__buy-btn";
    assetBuyButton.textContent = owned ? "OWNED" : `${asset.price_coins} 🪙`;
    assetBuyButton.disabled = owned || tooExpensive;

    if (owned) {
        console.log(`🔒 Asset ${asset.name} is owned`);
    }

    if (!owned && !tooExpensive) {
        assetBuyButton.addEventListener("click", async () => {
            assetBuyButton.disabled = true;
            assetBuyButton.textContent = "Buying...";

            try {
                const result = await purchaseAsset(asset.id);

                if (result.success) {
                    // Add to owned assets
                    currentOwnedAssetIds.push(asset.id);

                    // Update balance
                    if (result.coins !== null) {
                        renderCoinBalance(result.coins);
                    }

                    // Show success message
                    showToast({
                        message: `${asset.name} gekauft!`,
                        type: "success"
                    });

                    // Refresh shop display
                    loadShopAssets();
                } else {
                    throw new Error("Kauf fehlgeschlagen");
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Asset konnte nicht gekauft werden";
                showToast({
                    message,
                    type: "error"
                });

                // Reset button state
                assetBuyButton.disabled = false;
                assetBuyButton.textContent = `${asset.price_coins} 🪙`;
            }
        });
    }

    return assetBuyButton;
}

// ----- CATEGORY-TABS UND FILTER-FUNKTIONALITÄT -----

function createShopTabButton(category: AssetCategory | "all"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "shop-modal__tab";
    button.dataset.category = category;
    button.textContent = category === "all" ? "ALL" : `${category}s`.toUpperCase();

    if (category === "all") button.classList.add("shop-modal__tab--active");

    button.onclick = () => {
        shopTabs.querySelectorAll(".shop-modal__tab").forEach(btn => btn.classList.remove("shop-modal__tab--active"));
        button.classList.add("shop-modal__tab--active");
        loadShopAssets();
    };
    return button;
}

function renderShopTabs(categories: (AssetCategory | "all")[]): void {
    shopTabs.innerHTML = "";
    categories.forEach(category => {
        shopTabs.appendChild(createShopTabButton(category));
    });
}

async function loadShopTabs(): Promise<void> {
    const categories = ["all", ...fetchAssetCategories()];
    renderShopTabs(categories as AssetCategory[]);
}

function fetchAssetCategories(): AssetCategory[] {
    // Kategorien in Großbuchstaben zurückgeben, damit sie zu den Asset-Kategorien passen
    return [...ASSET_CATEGORIES] as AssetCategory[];
}

function getClickedCategory(target: HTMLElement): AssetCategory | "all" | null {
    if (target && target.tagName === "BUTTON" && target.dataset.category) {
        return target.dataset.category as AssetCategory | "all";
    }
    return null;
}

function filterAssetsByCategory(category: AssetCategory | "all"): Asset[] {
    return category === "all"
        ? currentAssets
        : currentAssets.filter(asset => asset.category === category);
}

