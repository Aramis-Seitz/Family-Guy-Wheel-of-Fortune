import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs, shopGrid } from "../shared/dom.js";
import { Asset, AssetCategory } from "../shared/types.js";
import { ASSET_CATEGORIES, EMPTY_STATE_THUMBNAIL_BY_CATEGORY } from "../shared/constants.js";
import { getOwnedAssetIds, getShopAssets, purchaseAsset } from "../api/shop.js";
import { showToast } from "../shared/toast.js";
import { getUserCoins } from "../api/user.js";
import { supabaseClient } from "../shared/supabase-client.js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ----- SHOP-MODAL ÖFFNEN/SCHLIESSEN -----

async function openShop(): Promise<void> {
    shopModal.showModal();
    await loadShop();
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

async function loadShop(): Promise<void> {
    await loadCoinBalance();
    await loadShopTabs();
    await loadShopAssets();
}


// ----- COIN BALANCE -----

let balance = 0;

function renderCoinBalance(newBalance: number) {
    balance = newBalance;
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${newBalance}`;
}

async function loadCoinBalance(): Promise<void> {
    try {
        const freshBalance = await getUserCoins();
        renderCoinBalance(freshBalance);
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
                renderCoinBalance(nextBalance);
                if (shopModal.open) loadShopAssets();
            }
        )
        .subscribe();
}


// ----- ASSET ERSTELLEN UND LADEN -----

let currentAssets: Asset[] = await getShopAssets();
let currentOwnedAssetIds: string[] = await getOwnedAssetIds();

function isAssetOwned(assetId: string): boolean {
    return currentOwnedAssetIds.includes(assetId);
}

function loadShopAssets(): void {
    shopGrid.innerHTML = "";
    const activeTab = shopTabs.querySelector(".shop-modal__tab--active") as HTMLElement;
    let activeCategory = getClickedCategory(activeTab) || "all";
    let filteredAssets: Asset[] = filterAssetsByCategory(activeCategory);
    filteredAssets.forEach(asset => shopGrid.appendChild(createAssetCard(asset)));
}

function createAssetCard(asset: Asset): HTMLElement {
    const owned = isAssetOwned(asset.id);
    const tooExpensive = balance < asset.price_coins;

    const assetCard = document.createElement("div");
    assetCard.className = "shop-modal__asset-card";

    if (owned) assetCard.classList.add("shop-modal__asset-card__owned");
    if (tooExpensive && !owned) assetCard.classList.add("shop-modal__asset-card__too-expensive");

    assetCard.appendChild(createAssetHeader(asset));
    assetCard.appendChild(createAssetFooter(asset, owned, tooExpensive));

    return assetCard;
}

function createAssetHeader(asset: Asset): HTMLElement {
    const assetHeader = document.createElement("div");
    assetHeader.className = "shop-modal__asset-header";
    assetHeader.appendChild(createAssetIcon(asset));
    return assetHeader;
}

function createAssetIcon(asset: Asset): HTMLElement {
    const assetIcon = document.createElement("img");
    assetIcon.className = "shop-modal__asset-icon";
    assetIcon.src = EMPTY_STATE_THUMBNAIL_BY_CATEGORY[asset.category] || "";
    assetIcon.alt = asset.name;
    return assetIcon;
}

function createAssetFooter(asset: Asset, owned: boolean, tooExpensive: boolean): HTMLElement {
    const assetFooter = document.createElement("div");
    assetFooter.className = "shop-modal__asset-footer";
    assetFooter.appendChild(createAssetDetailsRow(asset));
    assetFooter.appendChild(createAssetBuyButton(asset, owned, tooExpensive));
    return assetFooter;
}

function createAssetDetailsRow(asset: Asset): HTMLElement {
    const detailsRow = document.createElement("div");
    detailsRow.className = "shop-modal__asset-details-row";
    detailsRow.appendChild(createAssetTitle(asset));

    if (asset.category === "sound") {
        detailsRow.appendChild(createPreviewButton());
    }

    return detailsRow;
}

function createAssetTitle(asset: Asset): HTMLElement {
    const title = document.createElement("p");
    title.className = "shop-modal__asset-title";
    title.textContent = asset.name;
    return title;
}

function createPreviewButton(): HTMLElement {
    const previewButton = document.createElement("button");
    previewButton.className = "shop-modal__preview-btn";
    previewButton.textContent = "▷";
    return previewButton;
}

function createAssetBuyButton(asset: Asset, owned: boolean, tooExpensive: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "shop-modal__buy-btn";
    btn.textContent = owned ? "OWNED" : `${asset.price_coins} 🪙`;
    btn.disabled = owned || tooExpensive;

    if (!owned && !tooExpensive) btn.addEventListener("click", () => handlePurchaseClick(asset, btn));
    return btn;
}

async function handlePurchaseClick(asset: Asset, btn: HTMLButtonElement): Promise<void> {
    btn.disabled = true;
    btn.textContent = "Buying...";

    try {
        const result = await purchaseAsset(asset.id);
        if (!result.success) throw new Error("Kauf fehlgeschlagen");
        currentOwnedAssetIds.push(asset.id);
        if (result.coins !== null) {
            renderCoinBalance(result.coins);
        } else {
            await loadCoinBalance();
        }
        showToast({ message: `${asset.name} gekauft!`, type: "success" });
        loadShopAssets();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Asset konnte nicht gekauft werden";
        showToast({ message, type: "error" });
        btn.disabled = false;
        btn.textContent = `${asset.price_coins} 🪙`;
    }
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

async function loadShopTabs(): Promise<void> {
    const categories = ["all", ...ASSET_CATEGORIES];
    renderShopTabs(categories as AssetCategory[]);
}

function getClickedCategory(target: HTMLElement): AssetCategory | "all" | null {
    if (target && target.tagName === "BUTTON" && target.dataset.category) {
        return target.dataset.category as AssetCategory | "all";
    }
    return null;
}

function filterAssetsByCategory(category: AssetCategory | "all"): Asset[] {
    return category === "all"
        ? currentAssets
        : currentAssets.filter(asset => asset.category === category);
}

