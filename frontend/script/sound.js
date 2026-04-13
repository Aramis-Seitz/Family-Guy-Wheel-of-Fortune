import { tickSoundTemplate, drumrollAudio } from "./dom.js";
let drumrollStarted = false;
export function playTickSound() {
    if (!tickSoundTemplate)
        return;
    const tickSound = tickSoundTemplate.cloneNode(true);
    tickSound.play();
}
export function playDrumRoll() {
    if (!drumrollAudio || drumrollStarted)
        return;
    drumrollStarted = true;
    drumrollAudio.currentTime = 0;
    drumrollAudio.play();
}
export function stopDrumRoll() {
    if (!drumrollAudio)
        return;
    drumrollStarted = false;
    drumrollAudio.pause();
    drumrollAudio.currentTime = 0;
}
