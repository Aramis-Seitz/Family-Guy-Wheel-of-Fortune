import { handlePurchaseShopAsset } from "../src/controllers/shop-controller";

export default async function handler(req: any, res: any): Promise<void> {
  await handlePurchaseShopAsset(req, res);
}
