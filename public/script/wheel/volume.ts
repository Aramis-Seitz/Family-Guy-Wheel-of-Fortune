import { requiredElement } from "../shared/dom-helpers.js";
import { masterGain } from "./sound.js";

export const volumeSlider = requiredElement<HTMLInputElement>("volumeSlider");
export const volumeValue = requiredElement<HTMLSpanElement>("volumeValue");
export const volumeIcon = requiredElement<HTMLButtonElement>("volumeIcon");

export function updateVolumeDisplay(): void {
    if (!volumeSlider || !volumeValue || !volumeIcon) return;

    const volume = parseInt(volumeSlider.value);
    volumeValue.textContent = volume.toString();

    if (volume === 0) {
        volumeIcon.textContent = "🔇";
    } else if (volume <= 33) {
        volumeIcon.textContent = "🔈";
    } else if (volume <= 66) {
        volumeIcon.textContent = "🔉";
    } else {
        volumeIcon.textContent = "🔊";
    }

    applyVolumeToAudio(volume / 100);
}

let previousVolume: number | null = null;
const PREVIOUS_VOLUME_KEY = "wheelOfFortune_previousVolume";

function savePreviousVolume(volume: number): void {
    previousVolume = volume;
    localStorage.setItem(PREVIOUS_VOLUME_KEY, volume.toString());
}

const VOLUME_STORAGE_KEY = "wheelOfFortune_volume";

function onSliderChange(): void {
    if (!volumeSlider) return;
    const volume = parseInt(volumeSlider.value);
    if (volume > 0) savePreviousVolume(volume);
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
}

export function applyVolumeToAudio(volumeLevel: number): void {
    if (masterGain) masterGain.gain.value = volumeLevel;
}

export function toggleMute(): void {
    if (!volumeSlider) return;

    const currentVolume = parseInt(volumeSlider.value);

    if (currentVolume === 0) {
        volumeSlider.value = (previousVolume ?? 50).toString();
    } else {
        savePreviousVolume(currentVolume);
        volumeSlider.value = "0";
    }

    updateVolumeDisplay();
    localStorage.setItem(VOLUME_STORAGE_KEY, volumeSlider.value);
}

export function initVolumeSlider(): void {
    if (!volumeSlider || !volumeIcon) return;

    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    volumeSlider.value = savedVolume ?? "50";

    const savedPrevious = localStorage.getItem(PREVIOUS_VOLUME_KEY);
    if (savedPrevious) previousVolume = parseInt(savedPrevious);

    updateVolumeDisplay();
    volumeSlider.addEventListener("input", updateVolumeDisplay);
    volumeSlider.addEventListener("change", onSliderChange);
    volumeIcon.addEventListener("click", toggleMute);
}
