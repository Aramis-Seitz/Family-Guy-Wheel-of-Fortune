import { shopTabs, filterAssetsByCategory, renderCoinBalance, loadCoinBalance, balance } from "./shop";
import type { AssetCategory } from "./shop";
import { purchaseAsset } from "../api/shop-api";
import { getOwnedAssets } from "../api/inventory-api";
import { showToast } from "../shared/toast";
import { createAssetCard } from "../shared/asset-card";
import { getActiveCategory } from "../shared/category-tabs";
import { requiredElement } from "../shared/dom-helpers";
import type { Asset, AchievementWithProgress, UnlockedAchievement } from "shared";
import { formatNumber } from "../app/format";
import { t } from "../app/i18n";
import { showAchievementUnlockConfetti, showAchievementToast } from "../achievements/achievement-ui";

let currentOwnedAssetIds: string[] = [];

function isAssetOwned(assetId: string): boolean {
    return currentOwnedAssetIds.includes(assetId);
}

export const shopGrid = requiredElement<HTMLElement>("shop-modal-grid");

export async function loadShopAssets(): Promise<void> {
    currentOwnedAssetIds = (await getOwnedAssets()).map(asset => asset.id);
    shopGrid.innerHTML = "";
    const activeCategory = getActiveCategory<AssetCategory | "all">(shopTabs, "shop-modal") ?? "all";
    const filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => shopGrid.appendChild(createShopAssetCard(asset)));
}

function createShopAssetCard(asset: Asset): HTMLElement {
    const owned = isAssetOwned(asset.id);
    const tooExpensive = balance < asset.price_coins;

    return createAssetCard(asset, {
        cssPrefix: "shop-modal",
        cardStateClasses: [
            owned && "shop-modal__asset-card--owned",
            tooExpensive && !owned && "shop-modal__asset-card--too-expensive",
        ].filter((cls): cls is string => Boolean(cls)),
        renderActionButton: () => createAssetBuyButton(asset, owned, tooExpensive),
    });
}

function createAssetBuyButton(asset: Asset, owned: boolean, tooExpensive: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "shop-modal__buy-btn";
    btn.textContent = owned ? t("shop.owned") : `${formatNumber(asset.price_coins)} 🪙`;
    btn.disabled = owned || tooExpensive;

    if (!owned && !tooExpensive) btn.addEventListener("click", () => handlePurchaseClick(asset, btn));
    return btn;
}

function announcePurchaseAchievements(
    unlocked: UnlockedAchievement[],
    progressed: AchievementWithProgress[]
): void {
    // Wartet, bis der "Gekauft"-Toast durchgelaufen ist, da showToast() den
    // Toast-Container bei jedem Aufruf ersetzt und sich sonst überschneiden würde.
    setTimeout(() => {
        unlocked.forEach((achievement, index) => {
            setTimeout(() => showAchievementUnlockConfetti(achievement), index * 300);
        });
        progressed.forEach((achievement, index) => {
            setTimeout(() => showAchievementToast(achievement), (unlocked.length + index) * 300);
        });
    }, 3200);
}

async function handlePurchaseClick(asset: Asset, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = t("shop.buying");

    try {
        const result = await purchaseAsset(asset.id);
        if (!result.success) throw new Error(t("shop.purchaseFailed"));
        currentOwnedAssetIds.push(asset.id);
        await loadCoinBalance();
        renderCoinBalance();
        showToast({ message: t("shop.purchased", { name: asset.name }), type: "success" });
        loadShopAssets();
        announcePurchaseAchievements(result.unlockedAchievements, result.progressedAchievements);
    } catch (error) {
        const message = error instanceof Error ? error.message : t("shop.purchaseFailed");
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = `${formatNumber(asset.price_coins)} 🪙`;
    }
}
