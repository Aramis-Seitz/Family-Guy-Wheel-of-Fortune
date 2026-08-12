import { requiredElement, initToggleModal } from "../shared/dom-helpers";
import { loadShopAssets } from "./shop-assets";
import type { Asset } from "shared";
import { getShopAssets } from "../api/shop-api";
import { profileData } from "../profile/profile-data";
import { getActiveCategory, renderCategoryTabs } from "../shared/category-tabs";
import { formatNumber } from "../app/format";
import { t } from "../app/i18n";

// ----- SHOP-MODAL ÖFFNEN/SCHLIESSEN -----

export const shopModal = requiredElement<HTMLDialogElement>("shop-modal");

async function openShop(): Promise<void> {
    shopModal.showModal();
    await refreshShop();
}

export const shopBtn = requiredElement<HTMLButtonElement>("shop-btn");
export const shopCloseBtn = requiredElement<HTMLButtonElement>("shop-modal-close-btn");

export function initShop(): void {
    initToggleModal(shopModal, shopBtn, shopCloseBtn, openShop);
    profileData.subscribe((state) => {
        balance = state.coins;
        renderCoinBalance();
        if (shopModal.open) loadShopAssets();
    });
    window.addEventListener("app:language-changed", () => {
        const activeCategory = getActiveCategory<AssetCategory | "all">(shopTabs, "shop-modal") ?? "all";
        renderShopTabs(["all", ...ASSET_CATEGORIES] as (AssetCategory | "all")[], activeCategory);
        renderCoinBalance();
        if (shopModal.open) void loadShopAssets();
    });
}

export const ASSET_CATEGORIES: string[] = ["sound", "companion"] as const;
export type AssetCategory = typeof ASSET_CATEGORIES[number];

let currentAssets: Asset[] = [];

async function refreshShop(): Promise<void> {
    currentAssets = await getShopAssets();
    await loadCoinBalance();
    renderCoinBalance();
    renderShopTabs(["all", ...ASSET_CATEGORIES] as (AssetCategory | "all")[]);
    await loadShopAssets();
}


// ----- COIN BALANCE -----

export let balance = 0;

export const shopCoinBalance = requiredElement<HTMLDivElement>("shop-modal-coin-balance");

export function renderCoinBalance(): void {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${formatNumber(balance)}`;
}

export async function loadCoinBalance(): Promise<void> {
    try {
        await profileData.refreshCoins();
    } catch (error) {
        console.error("Coins konnten nicht aktualisiert werden:", error);
    }
}


// ----- CATEGORY-TABS UND FILTER-FUNKTIONALITÄT -----

export const shopTabs = requiredElement<HTMLElement>("shop-modal-tabs");

function renderShopTabs(categories: (AssetCategory | "all")[], activeCategory: AssetCategory | "all" = "all"): void {
    renderCategoryTabs(shopTabs, categories, {
        cssPrefix: "shop-modal",
        onSelect: loadShopAssets,
        activeCategory,
        labelFor: (category) => t(`categories.${category}`).toUpperCase(),
    });
}

export function filterAssetsByCategory(category: AssetCategory | "all"): Asset[] {
    return category === "all"
        ? currentAssets
        : currentAssets.filter(asset => asset.category === category);
}

