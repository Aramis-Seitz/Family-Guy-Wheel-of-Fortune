import { volumeSlider, volumeValue, volumeIcon } from "../shared/dom.js";
import { masterGain } from "./sound.js";

const VOLUME_STORAGE_KEY = "wheelOfFortune_volume";
const PREVIOUS_VOLUME_KEY = "wheelOfFortune_previousVolume";
let previousVolume: number | null = null;

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

function savePreviousVolume(volume: number): void {
    previousVolume = volume;
    localStorage.setItem(PREVIOUS_VOLUME_KEY, volume.toString());
}

function onSliderChange(): void {
    if (!volumeSlider) return;
    const volume = parseInt(volumeSlider.value);
    if (volume > 0) savePreviousVolume(volume);
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
}

export function applyVolumeToAudio(volumeLevel: number): void {
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
        audio.volume = volumeLevel;
    });
    if (masterGain) {
        masterGain.gain.value = volumeLevel;
    }
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
