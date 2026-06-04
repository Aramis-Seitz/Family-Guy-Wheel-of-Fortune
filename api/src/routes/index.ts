import { Router } from "express";
import { userRoutes } from "./user-routes";
import { shopRoutes } from "./shop-routes";
import { inventoryRoutes } from "./inventory-routes";

export const apiRoutes = Router();

apiRoutes.use("/user", userRoutes);
apiRoutes.use("/shop", shopRoutes);
apiRoutes.use("/inventory", inventoryRoutes);
