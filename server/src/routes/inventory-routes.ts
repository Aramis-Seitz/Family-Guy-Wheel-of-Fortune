import { Router } from "express";
import {
    handleGetOwnedAssets,
    handleGetSelectedAssetIds,
    handleSelectAsset,
    handleDeleteWheel,
    handleGetSavedWheels,
    handleSaveSavedWheels
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.get("/assets", handleGetOwnedAssets);
inventoryRoutes.get("/selected-asset-ids", handleGetSelectedAssetIds);
inventoryRoutes.post("/select", handleSelectAsset);
inventoryRoutes.post("/delete-saved-wheel", handleDeleteWheel);
inventoryRoutes.get("/saved-wheels", handleGetSavedWheels);
inventoryRoutes.post("/save-saved-wheel", handleSaveSavedWheels);