import { getOwnedAssets, getSelectedAssetIds } from "../api/inventory-api.js";
import { companionImage, tickSoundTemplate } from "./dom.js";
import { preloadTickBuffer } from "../wheel/sound.js";
import type { Asset } from "./types.js";

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
        if (selectedSound) applyActiveSound(selectedSound.asset_url);
        if (selectedCompanion) applyActiveCompanion(selectedCompanion.asset_url);
    } catch {
        // API nicht erreichbar — Assets bleiben ohne src
    }
}

// Wendet ein einzelnes Asset sofort auf die DOM an — wird nach einem SELECT-Klick im Inventar aufgerufen.
export function applySelectedAsset(asset: Asset): void {
    if (asset.category === "sound") applyActiveSound(asset.asset_url);
    if (asset.category === "companion") applyActiveCompanion(asset.asset_url);
}

function applyActiveSound(url: string): void {
    if (tickSoundTemplate) tickSoundTemplate.src = url;
    void preloadTickBuffer(url);
}

function applyActiveCompanion(url: string): void {
    if (companionImage) companionImage.src = url;
}
