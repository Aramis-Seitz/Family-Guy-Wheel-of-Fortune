import { closeOnBackdropClick, shopBtn, shopCloseBtn, shopModal, shopCoinBalance } from "../shared/dom.js";

interface User {        // wird später entfernt, nur zum Testen!
    id: string;
    username: string;
    email: string;
    coins: number;
    date_of_birth: Date;
}

const MOCK_USER: User = {       // wird später entfernt, nur zum Testen!
    id: "mock-user-123",
    username: "TestUser",
    email: "test@example.com",
    coins: 67,
    date_of_birth: new Date("2000-01-01"),
};

async function openShop(): Promise<void> {
    shopModal.showModal();
    await loadCoinBalance(MOCK_USER.id);
}

function closeShop(): void {
    shopModal.close();
}

export function initShop(): void {
    shopBtn.addEventListener("click", openShop);
    shopCloseBtn.addEventListener("click", closeShop);
    closeOnBackdropClick(shopModal, closeShop);
}

async function fetchCoinBalance(userId: string): Promise<number> { // erstmal nur MockFunktion ---> Später Anbindung zur Datenbank
    return MOCK_USER.coins;
}

function renderCoinBalance(balance: number) {
    if (!shopCoinBalance) return;
    shopCoinBalance.textContent = `🪙 ${balance}`
}

async function loadCoinBalance(userId: string): Promise<void> {
    const balance = await fetchCoinBalance(userId);
    renderCoinBalance(balance);
}