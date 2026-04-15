import express from "express";
import { getSecureRandomNumber } from "./utils/random";

const app = express();

const MIN_ROTATION_DEGREE: number = 140;
const MAX_ROTATION_DEGREE: number = 900;

app.get("/api/random", (req, res) => {
    const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
    res.json({ ranNum });
});

export default app;