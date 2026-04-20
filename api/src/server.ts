import express from "express";
import path from "path";
import { getSecureRandomNumber } from "./utils/random";


const app = express();
const PORT = 3000;
const MIN_ROTATION_DEGREE: number = 140;
const MAX_ROTATION_DEGREE: number = 900;



// Pfad zum Frontend
const frontendPath = path.join(__dirname, "../../public");

// Statische Dateien 
app.use(express.static(frontendPath));

//  API

app.get("/api/random", (req, res) => {
    const ranNum = getSecureRandomNumber(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);

    res.json({ ranNum });
});
 
 
// Fallback: index.html laden
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

