import { shopTabs, getClickedCategory, filterAssetsByCategory, renderCoinBalance, loadCoinBalance, balance } from "./shop.js";
import { getOwnedAssetIds, purchaseAsset } from "../api/shop-api.js";
import { showToast } from "../shared/toast.js";
import { resolveAssetImageSrc, createPreviewButton } from "../shared/asset-preview.js";
import { requiredElement } from "../shared/dom-helpers.js";
import type { Asset } from "shared";


// ----- ASSET ERSTELLEN UND LADEN -----

let currentOwnedAssetIds: string[] = [];

function isAssetOwned(assetId: string): boolean {
    return currentOwnedAssetIds.includes(assetId);
}

export const shopGrid = requiredElement<HTMLElement>("shop-modal-grid");

export async function loadShopAssets(): Promise<void> {
    currentOwnedAssetIds = await getOwnedAssetIds();
    shopGrid.innerHTML = "";
    const activeTab = shopTabs.querySelector(".shop-modal__tab--active") as HTMLElement;
    const activeCategory = getClickedCategory(activeTab) || "all";
    const filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => shopGrid.appendChild(createAssetCard(asset)));
}

function createAssetCard(asset: Asset): HTMLElement {
    const owned = isAssetOwned(asset.id);
    const tooExpensive = balance < asset.price_coins;

    const assetCard = document.createElement("div");
    assetCard.className = "shop-modal__asset-card";

    if (owned) assetCard.classList.add("shop-modal__asset-card__owned");
    if (tooExpensive && !owned) assetCard.classList.add("shop-modal__asset-card__too-expensive");

    assetCard.appendChild(createAssetHeader(asset));
    assetCard.appendChild(createAssetFooter(asset, owned, tooExpensive));

    return assetCard;
}

function createAssetHeader(asset: Asset): HTMLElement {
    const assetHeader = document.createElement("div");
    assetHeader.className = "shop-modal__asset-header";
    assetHeader.appendChild(createAssetIcon(asset));
    return assetHeader;
}

function createAssetIcon(asset: Asset): HTMLElement {
    const img = document.createElement("img");
    img.className = "shop-modal__asset-icon";
    img.src = resolveAssetImageSrc(asset);
    img.alt = asset.name;
    return img;
}

function createAssetFooter(asset: Asset, owned: boolean, tooExpensive: boolean): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "shop-modal__asset-footer";
    assetFooter.appendChild(createAssetDetailsRow(asset));
    assetFooter.appendChild(createAssetBuyButton(asset, owned, tooExpensive));
    return assetFooter;
}

function createAssetDetailsRow(asset: Asset): HTMLElement {
    const detailsRow = document.createElement("div");
    detailsRow.className = "shop-modal__asset-details-row";
    detailsRow.appendChild(createAssetTitle(asset));

    if (asset.category === "sound") {
        detailsRow.appendChild(createPreviewButton(asset, "shop-modal__preview-btn"));
    }

    return detailsRow;
}

function createAssetTitle(asset: Asset): HTMLElement {
    const title = document.createElement("p");
    title.className = "shop-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createAssetBuyButton(asset: Asset, owned: boolean, tooExpensive: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "shop-modal__buy-btn";
    btn.textContent = owned ? "OWNED" : `${asset.price_coins} 🪙`;
    btn.disabled = owned || tooExpensive;

    if (!owned && !tooExpensive) btn.addEventListener("click", () => handlePurchaseClick(asset, btn));
    return btn;
}

async function handlePurchaseClick(asset: Asset, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = "Buying...";

    try {
        const result = await purchaseAsset(asset.id);
        if (!result.success) throw new Error("Kauf fehlgeschlagen");
        currentOwnedAssetIds.push(asset.id);
        await loadCoinBalance();
        renderCoinBalance();
        showToast({ message: `${asset.name} gekauft!`, type: "success" });
        loadShopAssets();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Asset konnte nicht gekauft werden";
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = `${asset.price_coins} 🪙`;
    }
}
