import { handleGetOwnedAssets } from "../src/controllers/shop-controller";

export default async function handler(req: any, res: any): Promise<void> {
    await handleGetOwnedAssets(req, res);
}
