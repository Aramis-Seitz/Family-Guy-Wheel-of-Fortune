"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 3000;
// 👉 Pfad zum Frontend (wichtig!)
const frontendPath = path_1.default.join(__dirname, "../../frontend");
// 👉 Statische Dateien bereitstellen (HTML, JS, CSS)
app.use(express_1.default.static(frontendPath));
// 👉 Beispiel API
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend läuft!" });
});
// 👉 Fallback: index.html laden
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, "index.html"));
});
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map