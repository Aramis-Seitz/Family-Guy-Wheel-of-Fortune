import { Router } from "express";
import {
    handleGetOwnedAssets,
    handleGetSelectedAssetIds
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.get("/assets", handleGetOwnedAssets);
inventoryRoutes.get("/select", handleGetSelectedAssetIds);