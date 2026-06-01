import { Router } from "express";
import {
    handleGetShopAssets,
    handleGetOwnedAssets,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.get("/inventory", handleGetOwnedAssets);
shopRoutes.post("/purchase", handlePurchaseShopAsset);
