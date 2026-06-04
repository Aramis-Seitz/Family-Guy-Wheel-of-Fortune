import { Router } from "express";
import {
    handleGetOwnedAssets,
} from "../controllers/inventory-controller";

export const inventoryRoutes = Router();

inventoryRoutes.get("/assets", handleGetOwnedAssets);