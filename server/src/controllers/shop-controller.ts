import { z } from "zod";
import { getAssets, purchaseAsset } from "../services/shop-service";
import { asyncHandler } from "./response";
import type { HttpRequest, HttpResponse } from "./response";
import {
    AssetsResponseSchema,
    PurchaseResponseSchema,
} from "shared";

export const handleGetShopAssets = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const assets = await getAssets();
    res.status(200).json(AssetsResponseSchema.parse({ assets }));
});

const PurchaseRequestSchema = z.object({
    assetId: z.string().min(1),
});

export const handlePurchaseShopAsset = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const parsedBody = PurchaseRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: "assetId is required" });
        return;
    }

    const result = await purchaseAsset(req.userId!, parsedBody.data.assetId);
    res.status(201).json(PurchaseResponseSchema.parse(result));
});
