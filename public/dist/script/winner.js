import { getNames } from "./name-list.js";
import { stopDrumRoll } from "./sound.js";
import { currentRotation } from "./wheel-spin.js";
export function getWinningSegmentIndex(segmentCount) {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const stepAngle = 360 / segmentCount;
    const adjustedRotation = (360 - normalizedRotation + 270) % 360;
    return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}
export function displayWinner(winnerName) {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement)
        return;
    winnerElement.textContent = `Winner: ${winnerName}`;
}
export function resetDisplayWinner() {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement)
        return;
    winnerElement.textContent = "Winner: No result yet";
}
export function announceWinner(segmentCount) {
    stopDrumRoll();
    const winnerIndex = getWinningSegmentIndex(segmentCount);
    const names = getNames();
    const winnerName = names[winnerIndex];
    displayWinner(winnerName);
}
