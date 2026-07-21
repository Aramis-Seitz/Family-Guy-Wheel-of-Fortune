import { requiredElement, closeOnBackdropClick } from "../shared/dom-helpers";
import { loadShopAssets } from "./shop-assets";
import type { Asset } from "shared";
import { getShopAssets } from "../api/shop-api";
import { getUserCoins } from "../api/user-api";
import { supabaseClient } from "../shared/supabase-client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { t } from "../app/i18n";
import { formatNumber } from "../app/format";

// ----- SHOP-MODAL ÖFFNEN/SCHLIESSEN -----

export const shopModal = requiredElement<HTMLDialogElement>("shop-modal");

async function openShop(): Promise<void> {
    shopModal.showModal();
    await refreshShop();
}

function closeShop(): void {
    shopModal.close();
}

export const shopBtn = requiredElement<HTMLButtonElement>("shop-btn");
export const shopCloseBtn = requiredElement<HTMLButtonElement>("shop-modal-close-btn");

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
    subscribeToCoinUpdates();
    window.addEventListener('app:language-changed', () => {
        const activeCategory = getClickedCategory(
            shopTabs.querySelector('.shop-modal__tab--active') as HTMLElement,
        ) ?? 'all';
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
        balance = await getUserCoins();
    } catch (error) {
        console.error("Could not refresh coins:", error);
    }
}

async function subscribeToCoinUpdates(): Promise<void> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user?.id) return;

    supabaseClient
        .channel(`shop-coin-updates-${session.user.id}`)
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
            (payload: RealtimePostgresChangesPayload<{ coins?: number }>) => {
                const nextBalance = (payload.new as { coins?: number })?.coins;
                if (typeof nextBalance !== "number") return;
                balance = nextBalance;
                renderCoinBalance();
                if (shopModal.open) loadShopAssets();
            }
        )
        .subscribe();
}


// ----- CATEGORY-TABS UND FILTER-FUNKTIONALITÄT -----

export const shopTabs = requiredElement<HTMLElement>("shop-modal-tabs");

function createShopTabButton(category: AssetCategory | "all", activeCategory: AssetCategory | "all"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "shop-modal__tab";
    button.dataset.category = category;
    button.textContent = t(`categories.${category}`).toUpperCase();

    if (category === activeCategory) button.classList.add("shop-modal__tab--active");

    button.onclick = () => {
        shopTabs.querySelectorAll(".shop-modal__tab").forEach(btn => btn.classList.remove("shop-modal__tab--active"));
        button.classList.add("shop-modal__tab--active");
        loadShopAssets();
    };
    return button;
}

function renderShopTabs(categories: (AssetCategory | "all")[], activeCategory: AssetCategory | "all" = "all"): void {
    shopTabs.innerHTML = "";
    categories.forEach(category => {
        shopTabs.appendChild(createShopTabButton(category, activeCategory));
    });
}

export function getClickedCategory(target: HTMLElement): AssetCategory | "all" | null {
    if (target && target.tagName === "BUTTON" && target.dataset.category) {
        return target.dataset.category as AssetCategory | "all";
    }
    return null;
}

export function filterAssetsByCategory(category: AssetCategory | "all"): Asset[] {
    return category === "all"
        ? currentAssets
        : currentAssets.filter(asset => asset.category === category);
}

