import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import {
    handleGetShopAssets,
    handleGetOwnedAssetIds,
    handleGetAssetCategories,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.use(requireAuth);

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/owned-asset-ids", handleGetOwnedAssetIds);
shopRoutes.get("/categories", handleGetAssetCategories);
shopRoutes.post("/purchase", handlePurchaseShopAsset);
