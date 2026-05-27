import { Asset, ShopCategory } from "../shared/types.js";

export const MOCK_SHOP_CATEGORIES: ShopCategory[] = ["ALL", "SOUNDS", "COMPANIONS"];
const EMPTY_STATE_THUMBNAIL_SOUND: string = "../../assets/default-thumbnail-sound-asset.png";
const EMPTY_STATE_THUMBNAIL_COMPANION: string = "../../assets/default-thumbnail-companion-asset.png";

export interface User {
    id: string;
    username: string;
    email: string;
    coins: number;
    date_of_birth: Date;
}

export const MOCK_USERS: User[] = [
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

export const MOCK_ASSETS: Asset[] = [
    {
        id: "asset-001",
        name: "Lustige Soundeffekte",
        category: "SOUND",
        price_coins: 50,
        asset_url: EMPTY_STATE_THUMBNAIL_SOUND,
    },
    {
        id: "asset-002",
        name: "Stewie",
        category: "COMPANION",
        price_coins: 100,
        asset_url: EMPTY_STATE_THUMBNAIL_COMPANION,
    },
    {
        id: "asset-003",
        name: "Brian",
        category: "COMPANION",
        price_coins: 70,
        asset_url: EMPTY_STATE_THUMBNAIL_COMPANION,
    },
    {
        id: "asset-004",
        name: "Quagmire",
        category: "COMPANION",
        price_coins: 80,
        asset_url: EMPTY_STATE_THUMBNAIL_COMPANION,
    },
    {
        id: "asset-005",
        name: "Peter's Lachen",
        category: "SOUND",
        price_coins: 30,
        asset_url: EMPTY_STATE_THUMBNAIL_SOUND,
    },
    {
        id: "asset-006",
        name: "Meg's Jammern",
        category: "SOUND",
        price_coins: 60,
        asset_url: EMPTY_STATE_THUMBNAIL_SOUND,
    },
    {
        id: "asset-007",
        name: "Chris's Dummheit",
        category: "SOUND",
        price_coins: 40,
        asset_url: EMPTY_STATE_THUMBNAIL_SOUND,
    },
    {
        id: "asset-008",
        name: "Lois's Schimpfen",
        category: "SOUND",
        price_coins: 45,
        asset_url: EMPTY_STATE_THUMBNAIL_SOUND,
    },
    {
        id: "asset-009",
        name: "Cleveland",
        category: "COMPANION",
        price_coins: 90,
        asset_url: EMPTY_STATE_THUMBNAIL_COMPANION,
    },
    {
        id: "asset-010",
        name: "Joe",
        category: "COMPANION",
        price_coins: 85,
        asset_url: EMPTY_STATE_THUMBNAIL_COMPANION,
    },
];