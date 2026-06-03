import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetOwnedAssetIds,
    handleGetAssetCategories,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/shop/assets", handleGetShopAssets);
shopRoutes.get("/shop/owned-asset-ids", handleGetOwnedAssetIds);
shopRoutes.get("/shop/categories", handleGetAssetCategories);
shopRoutes.post("/shop/purchase", handlePurchaseShopAsset);
