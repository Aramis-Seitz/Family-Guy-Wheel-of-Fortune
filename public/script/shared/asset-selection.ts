import { getOwnedAssets, getSelectedAssetIds } from "../api/inventory-api.js";
import { companionImage, tickSoundTemplate } from "./dom.js";
import type { Asset } from "./types.js";

const DEFAULT_SOUND_URL = "/assets/sounds/peter-griffin-laugh.mp3";
const DEFAULT_COMPANION_URL = "/assets/companions/quagmire.png";

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
        applyActiveSound(selectedSound?.asset_url ?? DEFAULT_SOUND_URL);
        applyActiveCompanion(selectedCompanion?.asset_url ?? DEFAULT_COMPANION_URL);
    } catch {
        applyActiveSound(DEFAULT_SOUND_URL);
        applyActiveCompanion(DEFAULT_COMPANION_URL);
    }
}

// Wendet ein einzelnes Asset sofort auf die DOM an — wird nach einem SELECT-Klick im Inventar aufgerufen.
export function applySelectedAsset(asset: Asset): void {
    if (asset.category === "sound") applyActiveSound(asset.asset_url);
    if (asset.category === "companion") applyActiveCompanion(asset.asset_url);
}

function applyActiveSound(url: string): void {
    if (tickSoundTemplate) tickSoundTemplate.src = url;
}

function applyActiveCompanion(url: string): void {
    if (companionImage) companionImage.src = url;
}
