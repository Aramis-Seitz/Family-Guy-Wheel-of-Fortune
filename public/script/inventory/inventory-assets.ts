import { filterAssetsByCategory, loadInventoryByCategory, inventoryAssetGrid } from "./inventory"
import type { InventoryCategory } from "./inventory-tabs";
import type { Asset } from "shared";
import { getSelectedAssetIds, selectAsset } from "../api/inventory-api";
import { showToast } from "../shared/toast";
import { createAssetCard } from "../shared/asset-card";
import { applySelectedAsset } from "../shared/asset-selection";

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

    return createAssetCard(asset, {
        cssPrefix: "inventory-modal",
        cardStateClasses: selected ? ["inventory-modal__asset-card--selected"] : [],
        renderActionButton: () => createInventoryAssetSelectButton(asset, selected),
    });
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

        applySelectedAsset(asset);
        showToast({ message: `${asset.name} ausgewählt!`, type: "success" });
        loadInventoryByCategory();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Asset konnte nicht ausgewählt werden";
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = "SELECT";
    }
}
