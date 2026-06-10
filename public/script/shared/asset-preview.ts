import type { Asset } from "./types.js";
import { EMPTY_STATE_THUMBNAIL_BY_CATEGORY } from "./constants.js";
import { playAssetSound, stopAssetSound } from "../wheel/sound.js";

let activePreviewButton: HTMLButtonElement | null = null;

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
