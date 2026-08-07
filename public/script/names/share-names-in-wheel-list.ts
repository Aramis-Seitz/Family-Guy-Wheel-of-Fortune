import { getMultiplier, setMultiplierControlValue } from "../wheel/multiplier";
import { getNamesInWheelList, replaceNames } from "./names-in-wheel-list";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";

export function generateShareLink(): string {
    const names = getNamesInWheelList();
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
    setMultiplierControlValue(powerValue);
}

let initialized = false;

async function handleShareClick(): Promise<void> {
    const link = generateShareLink();

    try {
        await navigator.clipboard.writeText(link);
        showToast({
            message: t("names.copySuccess"),
            type: "success"
        });
    } catch (error) {
        console.error("Could not copy link:", error);
        showToast({
            message: t("names.copyFailed"),
            type: "error"
        });
    }
}

export function initShareFeature(): void {
    if (initialized) return;
    initialized = true;

    document.querySelectorAll<HTMLButtonElement>("[data-share-trigger]").forEach((button) => {
        button.addEventListener("click", () => {
            void handleShareClick();
        });
    });

    loadInformationFromUrl();
}
