import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetOwnedAssets,
    handleGetOwnedAssetIds,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/inventory", handleGetOwnedAssets);
shopRoutes.get("/owned-asset-ids", handleGetOwnedAssetIds);
shopRoutes.post("/purchase", handlePurchaseShopAsset);
