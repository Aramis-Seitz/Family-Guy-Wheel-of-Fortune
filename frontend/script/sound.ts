import { tickSoundTemplate, drumrollAudio } from "./dom.js";

let drumrollStarted = false;

export function playTickSound(): void {
  if (!tickSoundTemplate) return;
  const tickSound = tickSoundTemplate.cloneNode(true) as HTMLAudioElement;
  tickSound.play();
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
