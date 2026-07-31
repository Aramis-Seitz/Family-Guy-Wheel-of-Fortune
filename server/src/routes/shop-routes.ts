import { Router } from "express";
import {
    handleGetShopAssets,
    handlePurchaseShopAsset
} from "../controllers/shop-controller";

export const shopRoutes = Router();

shopRoutes.get("/assets", handleGetShopAssets);
shopRoutes.post("/purchases", handlePurchaseShopAsset);
