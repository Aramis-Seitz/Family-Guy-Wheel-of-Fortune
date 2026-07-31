import { z } from "zod";

export const AssetCategorySchema = z.enum(["sound", "companion"]);
export type AssetCategory = z.infer<typeof AssetCategorySchema>;
