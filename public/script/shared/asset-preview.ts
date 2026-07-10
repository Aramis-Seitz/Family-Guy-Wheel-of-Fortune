import type { AssetCategory } from "../shop/shop.js";
import type { Asset } from "shared";
import { playAssetSound, stopAssetSound } from "../wheel/sound.js";

let activePreviewButton: HTMLButtonElement | null = null;

const EMPTY_STATE_THUMBNAIL_SOUND: string = "../../resources/default-thumbnail-sound-asset.png";
const EMPTY_STATE_THUMBNAIL_COMPANION: string = "../../resources/default-thumbnail-companion-asset.png";

const EMPTY_STATE_THUMBNAIL_BY_CATEGORY: Partial<Record<AssetCategory, string>> = {
    sound: EMPTY_STATE_THUMBNAIL_SOUND,
    companion: EMPTY_STATE_THUMBNAIL_COMPANION,
};

export function resolveAssetImageSrc(asset: Asset): string {
    return (asset.category === "companion" && asset.asset_url)
        ? asset.asset_url
        : EMPTY_STATE_THUMBNAIL_BY_CATEGORY[asset.category] ?? "";
}

export function createPreviewButton(asset: Asset, className: string): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = "▶";

    btn.addEventListener("click", async () => {
        if (activePreviewButton === btn) {
            stopAssetSound();
            return;
        }
        activePreviewButton = btn;
        btn.textContent = "⏹";
        try {
            await playAssetSound(asset.asset_url);
        } finally {
            btn.textContent = "▶";
            if (activePreviewButton === btn) activePreviewButton = null;
        }
    });

    return btn;
}
