import { volumeSlider, volumeValue, volumeIcon } from "../shared/dom.js";

const VOLUME_STORAGE_KEY = "wheelOfFortune_volume";
let previousVolume: number | null = null;

export function updateVolumeDisplay(): void {
    if (!volumeSlider || !volumeValue || !volumeIcon) return;

    const volume = parseInt(volumeSlider.value);
    volumeValue.textContent = volume.toString();

    if (volume === 0) {
        volumeIcon.textContent = "🔇";
    } else if (volume < 33) {
        volumeIcon.textContent = "🔈";
    } else if (volume < 67) {
        volumeIcon.textContent = "🔉";
    } else {
        volumeIcon.textContent = "🔊";
    }

    applyVolumeToAudio(volume / 100);
}

function saveVolumeToStorage(): void {
    if (!volumeSlider) return;
    const volume = parseInt(volumeSlider.value);
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
}

export function applyVolumeToAudio(volumeLevel: number): void {
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
        audio.volume = volumeLevel;
    });
}

export function toggleMute(): void {
    if (!volumeSlider) return;

    const currentVolume = parseInt(volumeSlider.value);

    if (currentVolume === 0) {
        if (previousVolume !== null) {
            volumeSlider.value = previousVolume.toString();
        }
    } else {
        previousVolume = currentVolume;
        volumeSlider.value = "0";
    }

    updateVolumeDisplay();
    saveVolumeToStorage();
}

export function initVolumeSlider(): void {
    if (!volumeSlider || !volumeIcon) return;

    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (savedVolume) {
        volumeSlider.value = savedVolume;
    } else {
        volumeSlider.value = "50";
    }

    updateVolumeDisplay();
    volumeSlider.addEventListener("input", updateVolumeDisplay);
    volumeSlider.addEventListener("change", saveVolumeToStorage);
    volumeIcon.addEventListener("click", toggleMute);
}
