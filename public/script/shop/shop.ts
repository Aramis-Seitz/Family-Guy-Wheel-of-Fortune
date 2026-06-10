import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs } from "../shared/dom.js";
import { Asset, AssetCategory } from "../shared/types.js";
import { ASSET_CATEGORIES } from "../shared/constants.js";
import { loadShopAssets } from "./shop-assets.js";
import { getShopAssets } from "../api/shop-api.js";
import { getUserCoins } from "../api/user-api.js";
import { supabaseClient } from "../shared/supabase-client.js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

let currentAssets: Asset[] = await getShopAssets();


// ----- SHOP-MODAL ÖFFNEN/SCHLIESSEN -----

async function openShop(): Promise<void> {
    shopModal.showModal();
    await refreshShop();
}

function closeShop(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
    subscribeToCoinUpdates();
}

async function refreshShop(): Promise<void> {
    await loadCoinBalance();
    renderCoinBalance();
    renderShopTabs(["all", ...ASSET_CATEGORIES] as (AssetCategory | "all")[]);
    await loadShopAssets();
}


// ----- COIN BALANCE -----

export let balance = 0;

export function renderCoinBalance(): void {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`;
}

export async function loadCoinBalance(): Promise<void> {
    try {
        balance = await getUserCoins();
    } catch (error) {
        console.error("Coins konnten nicht aktualisiert werden:", error);
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

function createShopTabButton(category: AssetCategory | "all"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "shop-modal__tab";
    button.dataset.category = category;
    button.textContent = category === "all" ? "ALL" : `${category}s`.toUpperCase();

    if (category === "all") button.classList.add("shop-modal__tab--active");

    button.onclick = () => {
        shopTabs.querySelectorAll(".shop-modal__tab").forEach(btn => btn.classList.remove("shop-modal__tab--active"));
        button.classList.add("shop-modal__tab--active");
        loadShopAssets();
    };
    return button;
}

function renderShopTabs(categories: (AssetCategory | "all")[]): void {
    shopTabs.innerHTML = "";
    categories.forEach(category => {
        shopTabs.appendChild(createShopTabButton(category));
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

