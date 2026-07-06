import { Router } from "express";
import {
    handleGetOwnedAssets,
    handleGetSelectedAssetIds,
    handleSelectAsset,
    handleDeleteWheel
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.get("/assets", handleGetOwnedAssets);
inventoryRoutes.get("/selected-asset-ids", handleGetSelectedAssetIds);
inventoryRoutes.post("/select", handleSelectAsset);
inventoryRoutes.post("/delete-wheel", handleDeleteWheel);