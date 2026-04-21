import { getNames, addName, clearNames } from "./name-list.js";
import { shareBtn } from "./dom.js";
import { getMultiplier, updateMultiplierDisplay, setMultiplierSlider } from "./wheel-spin.js";    

export function generateShareLink(): string {
    const names = getNames();
    const encodedNames = encodeURIComponent(JSON.stringify(names));
    const sliderValue = getMultiplier()
    return `${window.location.origin}${window.location.pathname}?names=${encodedNames}&power=${sliderValue}`;
}

export function loadInformationFromUrl(): void {
    // --- Names ---
    const params = new URLSearchParams(window.location.search);
    const namesParam = params.get("names");

    if (!namesParam) return;

    let names: string[];

    try {
        names = JSON.parse(decodeURIComponent(namesParam));
    } catch {
        console.error("Invalid names parameter in URL.");
        return;
    }

    if (!Array.isArray(names)) return;

    clearNames();

    names.forEach((name) => {
        if (typeof name === "string" && name.trim()) {
            addName(name);
        }
    });
    // --- Power ---
    const powerParam = params.get("power");
    const powerValue: number = Number(powerParam);
    if (powerValue < 1 || powerValue > 2) return;
    setMultiplierSlider(powerValue);
    updateMultiplierDisplay();
}

export function initShareFeature(): void {
    console.log("initShareFeature loaded");
    console.log("shareBtn:", shareBtn);

    shareBtn?.addEventListener("click", async () => {
        console.log("share button clicked");

        const link = generateShareLink();
        console.log("Share link:", link);

        try {
            await navigator.clipboard.writeText(link);
            alert("Link copied!");
        } catch (error) {
            console.error("Could not copy link:", error);
            alert(link);
        }
    });

    loadInformationFromUrl();
}