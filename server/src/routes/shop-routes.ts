import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetAssetCategories,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/categories", handleGetAssetCategories);
shopRoutes.post("/purchases", handlePurchaseShopAsset);
