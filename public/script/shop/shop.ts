import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance, shopTabs } from "../shared/dom.js";
import { fetchUserCoins } from "../profile/profiles.js";
import { ShopCategory } from "../shared/types.js";

interface User {        // wird später entfernt, nur zum Testen!
    id: string;
    username: string;
    email: string;
    coins: number;
    date_of_birth: Date;
}

const MOCK_USERS: User[] = [     // wird später entfernt, nur zum Testen!
    {
        id: "mock-user-123",
        username: "TestUser",
        email: "test@example.com",
        coins: 67,
        date_of_birth: new Date("2000-01-01"),
    },
    {
        id: "mock-user-456",
        username: "OtherUser",
        email: "other@example.com",
        coins: 200,
        date_of_birth: new Date("1995-05-15"),
    },
];

const SHOP_CATEGORIES: ShopCategory[] = ["ALL", "SOUNDS", "COMPANIONS"];

async function openShop(): Promise<void> {
    shopModal.showModal();
    await loadCoinBalance();
    await loadShopTabs();
}

function closeShop(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
}

function renderCoinBalance(balance: number) {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`
}

async function loadCoinBalance(): Promise<void> {
    const balance = await fetchUserCoins();
    renderCoinBalance(balance);
}
async function fetchShopCategories(): Promise<ShopCategory[]> {
    return SHOP_CATEGORIES;    // MOCK, später aus Datenbank holen!
}

function renderShopTabs(categories: ShopCategory[]): void {
    shopTabs.innerHTML = "";

    categories.forEach(category => {
        const button = document.createElement("button");
        button.className = "shop-modal__tab";
        button.dataset.category = category;
        button.textContent = category;
        shopTabs.appendChild(button);
    })
}

async function loadShopTabs(): Promise<void> {
    const categories = await fetchShopCategories();
    renderShopTabs(categories);
}