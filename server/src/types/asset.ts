export type AssetCategory = "sound" | "companion";

export type Asset = {
    readonly id: string;
    readonly name: string;
    readonly category: AssetCategory;
    readonly price_coins: number;
    readonly asset_url: string;
};
