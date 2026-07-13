import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import {
    handleGetOwnedAssets,
    handleGetSelectedAssetIds,
    handleSelectAsset,
    handleDeleteWheel,
    handleGetSavedWheels,
    handleSaveSavedWheels
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.use(requireAuth);

inventoryRoutes.get("/assets", handleGetOwnedAssets);
inventoryRoutes.get("/selected-asset-ids", handleGetSelectedAssetIds);
inventoryRoutes.post("/select", handleSelectAsset);
inventoryRoutes.post("/delete-saved-wheel", handleDeleteWheel);
inventoryRoutes.get("/saved-wheels", handleGetSavedWheels);
inventoryRoutes.post("/save-saved-wheel", handleSaveSavedWheels);