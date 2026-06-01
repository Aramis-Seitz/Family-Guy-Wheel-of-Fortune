import { handleUserCoins } from "../src/controllers/user-controller";

export default async function handler(req: any, res: any): Promise<void> {
  await handleUserCoins(req, res);
}
