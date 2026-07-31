import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import { handleGenerateSpin } from "../controllers/spin-controller";
import { usersRoutes } from "./users-routes";
import { shopRoutes } from "./shop-routes";
import { roomRoutes } from "./room-routes";
import { spinRoutes } from "./spin-routes";

export const apiRoutes = Router();

apiRoutes.use(requireAuth);

apiRoutes.use("/users", usersRoutes);
apiRoutes.use("/shop", shopRoutes);
apiRoutes.use("/rooms", roomRoutes);
apiRoutes.post("/spins", handleGenerateSpin);
apiRoutes.use("/spin", spinRoutes);
