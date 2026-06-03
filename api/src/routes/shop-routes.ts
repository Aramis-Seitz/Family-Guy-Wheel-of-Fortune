import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetOwnedAssetIds,
    handleGetAssetCategories,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/owned-asset-ids", handleGetOwnedAssetIds);
shopRoutes.get("/categories", handleGetAssetCategories);
shopRoutes.post("/purchase", handlePurchaseShopAsset);
