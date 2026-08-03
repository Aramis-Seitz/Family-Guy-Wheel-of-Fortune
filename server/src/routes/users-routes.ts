import { Router } from "express";
import { requireSelf } from "../middleware/require-self";
import {
    handleRegisterUser,
    handleUserProfile,
    handleGetUserCoins,
    handlePatchUserCoins,
    handleEnsureDefaultAssets
} from "../controllers/user-controller";
import {
    handleGetOwnedAssets,
    handleGetSelectedAssets,
    handleSelectAsset,
    handleGetSavedWheels,
    handleSaveSavedWheels,
    handleDeleteWheel
} from "../controllers/inventory-controller";

export const usersRoutes = Router();

usersRoutes.param("userId", requireSelf);

usersRoutes.post("/", handleRegisterUser);
usersRoutes.get("/:userId", handleUserProfile);
usersRoutes.get("/:userId/coins", handleGetUserCoins);
usersRoutes.patch("/:userId/coins", handlePatchUserCoins);
usersRoutes.get("/:userId/inventory/assets", handleGetOwnedAssets);
usersRoutes.post("/:userId/inventory/default-assets", handleEnsureDefaultAssets);
usersRoutes.get("/:userId/inventory/selected-assets", handleGetSelectedAssets);
usersRoutes.post("/:userId/inventory/selected-assets", handleSelectAsset);
usersRoutes.get("/:userId/saved-wheels", handleGetSavedWheels);
usersRoutes.post("/:userId/saved-wheels", handleSaveSavedWheels);
usersRoutes.delete("/:userId/saved-wheels/:wheelId", handleDeleteWheel);
