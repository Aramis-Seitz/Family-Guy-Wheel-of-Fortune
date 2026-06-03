import { Router } from "express";
import {
    handleGetOwnedAssets,
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.get("/inventory/assets", handleGetOwnedAssets);