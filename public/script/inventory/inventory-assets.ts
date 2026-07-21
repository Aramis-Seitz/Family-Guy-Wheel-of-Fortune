import { filterAssetsByCategory, loadInventoryByCategory, inventoryAssetGrid } from "./inventory"
import type { InventoryCategory } from "./inventory";
import type { Asset } from "shared";
import { getSelectedAssetIds, selectAsset } from "../api/inventory-api";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";
import { resolveAssetImageSrc, createPreviewButton } from "../shared/asset-preview";
import { applySelectedAsset } from "../shared/asset-selection";


// ----- ASSET ERSTELLEN UND LADEN -----

let currentSelectedAssetIds: string[] = [];

export async function refreshSelectedAssetIds(): Promise<void> {
    currentSelectedAssetIds = await getSelectedAssetIds();
}

function isAssetSelected(assetId: string): boolean {
    return currentSelectedAssetIds.includes(assetId);
}

export function loadOwnedAssets(activeCategory: InventoryCategory): void {
    const filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => inventoryAssetGrid.appendChild(createInventoryAssetCard(asset)));
}

function createInventoryAssetCard(asset: Asset): HTMLElement {
    const selected = isAssetSelected(asset.id);
    const assetCard = document.createElement("div");
    assetCard.className = "inventory-modal__asset-card";
    if (selected) assetCard.classList.add("inventory-modal__asset-card--selected");

    assetCard.appendChild(createInventoryAssetHeader(asset));
    assetCard.appendChild(createInventoryAssetFooter(asset, selected));

    return assetCard;
}

function createInventoryAssetHeader(asset: Asset): HTMLElement {
    const assetHeader = document.createElement("div");
    assetHeader.className = "inventory-modal__asset-header";
    assetHeader.appendChild(createAssetIcon(asset));
    return assetHeader;
}

function createAssetIcon(asset: Asset): HTMLElement {
    const img = document.createElement("img");
    img.className = "inventory-modal__asset-icon";
    img.src = resolveAssetImageSrc(asset);
    img.alt = asset.name;
    return img;
}

function createInventoryAssetFooter(asset: Asset, selected: boolean): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "inventory-modal__asset-footer";
    assetFooter.appendChild(createInventoryAssetDetailsRow(asset));
    assetFooter.appendChild(createInventoryAssetSelectButton(asset, selected));
    return assetFooter;
}

function createInventoryAssetDetailsRow(asset: Asset): HTMLElement {
    const detailsRow = document.createElement("div");
    detailsRow.className = "inventory-modal__asset-details-row";
    detailsRow.appendChild(createInventoryAssetTitle(asset));

    if (asset.category === "sound") {
        detailsRow.appendChild(createPreviewButton(asset, "inventory-modal__preview-btn"));
    }

    return detailsRow;
}

function createInventoryAssetTitle(asset: Asset): HTMLElement {
    const title = document.createElement("p");
    title.className = "inventory-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createInventoryAssetSelectButton(asset: Asset, selected: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "inventory-modal__select-btn";
    btn.textContent = selected ? t('inventoryAssets.selected') : t('inventoryAssets.select');
    btn.disabled = selected;

    if (!selected) btn.addEventListener("click", () => handleSelectionClick(asset, btn));
    return btn;
}

async function handleSelectionClick(asset: Asset, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = t('inventoryAssets.selecting');

    try {
        const result = await selectAsset(asset.id);
        if (!result.success) throw new Error(t('inventoryAssets.selectionFailed'));

        const previousId = filterAssetsByCategory(asset.category)
            .find(a => currentSelectedAssetIds.includes(a.id))?.id;
        currentSelectedAssetIds = currentSelectedAssetIds.filter(id => id !== previousId);
        currentSelectedAssetIds.push(asset.id);

        applySelectedAsset(asset);
        showToast({ message: t('inventoryAssets.selected', { name: asset.name }), type: "success" });
        loadInventoryByCategory();
    } catch (error) {
        const message = error instanceof Error ? error.message : t('inventoryAssets.selectAssetFailed');
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = t('inventoryAssets.select');
    }
}
