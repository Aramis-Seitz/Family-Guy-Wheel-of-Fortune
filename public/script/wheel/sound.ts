import { cymbalCrashAudio, drumrollAudio, tickSoundTemplate } from "../shared/dom.js";

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

export function playCymbalCrash(): void {
  if (!cymbalCrashAudio) return;
  cymbalCrashAudio.currentTime = 0;
  cymbalCrashAudio.play();
}
