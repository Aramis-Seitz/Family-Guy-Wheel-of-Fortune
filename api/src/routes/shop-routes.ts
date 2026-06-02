import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetOwnedAssets,
    handleGetOwnedAssetIds,
    handleGetAssetCategories,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/inventory", handleGetOwnedAssets);
shopRoutes.get("/owned-asset-ids", handleGetOwnedAssetIds);
shopRoutes.get("/categories", handleGetAssetCategories);
shopRoutes.post("/purchase", handlePurchaseShopAsset);
