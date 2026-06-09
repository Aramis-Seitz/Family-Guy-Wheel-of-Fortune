import { inventoryAssetGrid } from "../shared/dom.js";
import { Asset, InventoryCategory } from "../shared/types.js";
import { EMPTY_STATE_THUMBNAIL_BY_CATEGORY } from "../shared/constants.js";
import { filterAssetsByCategory, loadInventoryByCategory } from "./inventory.js"
import { getOwnedAssets, getSelectedAssetIds, selectAsset } from "../api/inventory-api.js";
import { getOwnedAssetIds } from "../api/shop-api.js";
import { showToast } from "../shared/toast.js";


// ----- ASSET ERSTELLEN UND LADEN -----

let currentSelectedAssetIds: string[] = await getSelectedAssetIds();

export async function refreshSelectedAssetIds(): Promise<void> {
    currentSelectedAssetIds = await getSelectedAssetIds();
}
let currentOwnedAssetIds: string[] = await getOwnedAssetIds();
let currentOwnedAssets: Asset[] = await getOwnedAssets();

function isAssetSelected(assetId: string): boolean {
    return currentSelectedAssetIds.includes(assetId);
}

/*
function isAssetOwned(assetId: string): boolean {
    return currentOwnedAssetIds.includes(assetId);
}
*/

export function loadOwnedAssets(activeCategory: InventoryCategory): void {
    let filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => inventoryAssetGrid.appendChild(createInventoryAssetCard(asset)));
}

function createInventoryAssetCard(asset: Asset): HTMLElement {
    const selected = isAssetSelected(asset.id);
    const assetCard = document.createElement("div");
    assetCard.className = "inventory-modal__asset-card";
    if (selected) assetCard.classList.add("inventory-modal__asset-card__selected");

    assetCard.appendChild(createInventoryAssetHeader(asset));
    assetCard.appendChild(createInventoryAssetFooter(asset, selected));

    return assetCard;
}

function createInventoryAssetHeader(asset: Asset): HTMLElement {
    // Selbe Logik wie in /shop-assets.ts
    const assetHeader = document.createElement("div");
    assetHeader.className = "inventory-modal__asset-header";
    assetHeader.appendChild(createAssetIcon(asset));
    return assetHeader;
}

function createAssetIcon(asset: Asset): HTMLElement {
    // Selbe Logik wie in /shop-assets.ts
    const assetIcon = document.createElement("img");
    assetIcon.className = "inventory-modal__asset-icon";
    assetIcon.src = (asset.category === "companion" && asset.asset_url)
        ? asset.asset_url
        : EMPTY_STATE_THUMBNAIL_BY_CATEGORY[asset.category] || "";
    assetIcon.alt = asset.name;
    return assetIcon;
}

function createInventoryAssetFooter(asset: Asset, selected: boolean): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "inventory-modal__asset-footer";
    assetFooter.appendChild(createInventoryAssetDetailsRow(asset));
    assetFooter.appendChild(createInventoryAssetSelectButton(asset, selected));
    return assetFooter;
}

function createInventoryAssetDetailsRow(asset: Asset): HTMLElement {
    // Selbe Logik wie in /shop-assets.ts
    const detailsRow = document.createElement("div");
    detailsRow.className = "inventory-modal__asset-details-row";
    detailsRow.appendChild(createInventoryAssetTitle(asset));

    if (asset.category === "sound") {
        detailsRow.appendChild(createInventoryPreviewButton());
    }

    return detailsRow;
}

function createInventoryAssetTitle(asset: Asset): HTMLElement {
    // Selbe Logik wie in /shop-assets.ts
    const title = document.createElement("p");
    title.className = "inventory-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createInventoryPreviewButton(): HTMLElement {
    // Selbe Logik wie in /shop-assets.ts
    const previewButton = document.createElement("button");
    previewButton.className = "inventory-modal__preview-btn";
    previewButton.textContent = "▷";
    return previewButton;
}

function createInventoryAssetSelectButton(asset: Asset, selected: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "inventory-modal__select-btn";
    btn.textContent = selected ? "SELECTED ✓" : "SELECT";
    btn.disabled = selected;

    if (!selected) btn.addEventListener("click", () => handleSelectionClick(asset, btn));
    return btn;
}

async function handleSelectionClick(asset: Asset, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = "Selecting...";

    try {
        const result = await selectAsset(asset.id);
        if (!result.success) throw new Error("Auswählen fehlgeschlagen");

        const previousId = filterAssetsByCategory(asset.category)
            .find(a => currentSelectedAssetIds.includes(a.id))?.id;
        currentSelectedAssetIds = currentSelectedAssetIds.filter(id => id !== previousId);
        currentSelectedAssetIds.push(asset.id);

        showToast({ message: `${asset.name} ausgewählt!`, type: "success" });
        loadInventoryByCategory();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Asset konnte nicht ausgewählt werden";
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = "SELECT";
    }
}