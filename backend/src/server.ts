import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// Pfad zum Frontend
const frontendPath = path.join(__dirname, "../../frontend");

// Statische Dateien 
app.use(express.static(frontendPath));

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});