import { getSelectedAssets } from "../api/inventory-api";
import { optionalElement } from "./dom-helpers";
import { preloadTickBuffer } from "../wheel/sound";
import type { Asset } from "shared";

export async function applyActiveAssets(): Promise<void> {
    try {
        const selectedAssets = await getSelectedAssets();
        const selectedSound = selectedAssets.find(a => a.category === "sound");
        const selectedCompanion = selectedAssets.find(a => a.category === "companion");
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
