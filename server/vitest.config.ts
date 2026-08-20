import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        mockReset: true,
        // Nur Quelldateien testen. Ein alter dist/-Ordner aus einem frueheren
        // Build darf nicht als Test-Suite auftauchen.
        exclude: ["**/node_modules/**", "dist/**"],
    },
});
