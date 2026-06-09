import { cymbalCrashAudio, drumrollAudio, tickSoundTemplate } from "../shared/dom.js";

let drumrollStarted = false;
let previewAudio: HTMLAudioElement | null = null;

export function playTickSound(): void {
  if (!tickSoundTemplate) return;
  const tickSound = tickSoundTemplate.cloneNode(true) as HTMLAudioElement;
  tickSound.play();
}

// export async function playAssetSound(assetUrl: string): Promise<void> {
//   if (!assetUrl) return;

//   if (previewAudio) {
//     previewAudio.pause();
//     previewAudio.currentTime = 0;
//   }

//   previewAudio = new Audio(assetUrl);
//   previewAudio.play().catch(error => {
//     console.error("Sound konnte nicht abgespielt werden:", error);
//   });
// }

// export function playAssetSound(assetUrl: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const audio = new Audio(assetUrl);

//     audio.onended = () => resolve();
//     audio.onerror = reject;

//     audio.play().catch(reject);
//   });
// }

let currentAudio: HTMLAudioElement | null = null;
let currentResolve: (() => void) | null = null;

export function stopAssetSound(): void {
  if (!currentAudio) return;

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;

  const resolve = currentResolve;
  currentResolve = null;
  resolve?.(); // löst den laufenden await auf -> finally setzt Text zurück
}

export function playAssetSound(assetUrl: string): Promise<void> {
  stopAssetSound(); // alten Sound + alten Promise abbrechen

  const audio = new Audio(assetUrl);
  currentAudio = audio;

  return new Promise((resolve) => {
    currentResolve = resolve;

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
        currentResolve = null;
        resolve();
      }
    };

    void audio.play();
  });
}

export function playDrumRoll(): void {
  if (!drumrollAudio || drumrollStarted) return;
  drumrollStarted = true;
  drumrollAudio.currentTime = 0;
  drumrollAudio.play();
}

export function stopDrumRoll(): void {
  if (!drumrollAudio) return;
  drumrollStarted = false;
  drumrollAudio.pause();
  drumrollAudio.currentTime = 0;
}

export function playCymbalCrash(): void {
  if (!cymbalCrashAudio) return;
  cymbalCrashAudio.currentTime = 0;
  cymbalCrashAudio.play();
}
