import { shareBtn } from "../shared/dom.js";
import { getMultiplier, setMultiplierSlider, updateMultiplierDisplay } from "../wheel/spin.js";
import { getNames, replaceNames } from "./name-list.js";

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

    replaceNames(names.filter((name): name is string => typeof name === "string"));

    // --- Power ---
    const powerParam = params.get("power");
    const powerValue: number = Number(powerParam);
    if (!Number.isFinite(powerValue) || powerValue < 1 || powerValue > 2) return;
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
