import { getOwnedAssets, getSelectedAssetIds } from "../api/inventory-api.js";
import { optionalElement } from "./dom-helpers.js";
import { preloadTickBuffer } from "../wheel/sound.js";
import type { Asset } from "shared";

export async function applyActiveAssets(): Promise<void> {
    try {
        const [selectedIds, ownedAssets] = await Promise.all([
            getSelectedAssetIds(),
            getOwnedAssets()
        ]);
        const selectedSound = ownedAssets.find(
            a => a.category === "sound" && selectedIds.includes(a.id)
        );
        const selectedCompanion = ownedAssets.find(
            a => a.category === "companion" && selectedIds.includes(a.id)
        );
        if (selectedSound) void preloadTickBuffer(selectedSound.asset_url);
        if (selectedCompanion) applyActiveCompanion(selectedCompanion.asset_url);
    } catch {
        // API nicht erreichbar — Assets bleiben ohne src
    }
}

// Wendet ein einzelnes Asset sofort auf die DOM an — wird nach einem SELECT-Klick im Inventar aufgerufen.
export function applySelectedAsset(asset: Asset): void {
    if (asset.category === "sound") void preloadTickBuffer(asset.asset_url);
    if (asset.category === "companion") applyActiveCompanion(asset.asset_url);
}

const companionImage = optionalElement<HTMLImageElement>("wheel-companion-image");

function applyActiveCompanion(url: string): void {
    if (companionImage) companionImage.src = url;
}
