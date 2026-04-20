import express from "express";
import { getSecureRandomNumber } from "./utils/random.js";

const app = express();

const MIN_ROTATION_DEGREE: number = 140;
const MAX_ROTATION_DEGREE: number = 900;

app.get("/dist/api/random.js", (req, res) => {
    const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
    res.json({ ranNum });
});

export default app;
/*wie kann diese änderung nicht auf dem repo sein hää?*/