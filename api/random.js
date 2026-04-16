import { getSecureRandomNumber } from "./dist/utils/random.js";

export default function handler(req, res) {
    try {
        const ranNum = getSecureRandomNumber(140, 900);
        res.status(200).json({ ranNum });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate number" });
    }
}