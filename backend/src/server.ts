import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// Pfad zum Frontend
const frontendPath = path.join(__dirname, "../../frontend");

// Statische Dateien 
app.use(express.static(frontendPath));

//  API
app.get("/api/random", (req, res) => {
    const ranNum: number = Math.floor(Math.random() * 1800) + 1;

    res.json({ ranNum });
});
 
 
// Fallback: index.html laden
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});