"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const random_1 = require("./utils/random");
const app = (0, express_1.default)();
const PORT = 3000;
const MIN_ROTATION_DEGREE = 70;
const MAX_ROTATION_DEGREE = 900;
// Pfad zum Frontend
const frontendPath = path_1.default.join(__dirname, "../../frontend");
// Statische Dateien 
app.use(express_1.default.static(frontendPath));
//  API
app.get("/api/random", (req, res) => {
    const ranNum = (0, random_1.getSecureRandomNumber)(MIN_ROTATION_DEGREE, MAX_ROTATION_DEGREE);
    res.json({ ranNum });
});
// Fallback: index.html laden
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, "index.html"));
});
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
