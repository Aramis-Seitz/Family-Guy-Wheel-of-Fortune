import { handleUserProfile } from "../src/controllers/user-controller";

export default async function handler(req: any, res: any): Promise<void> {
  await handleUserProfile(req, res);
}
