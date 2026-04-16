import {getNames} from "./name-list.js";
import {stopDrumRoll} from "./sound.js";
import {currentRotation} from "./wheel-spin.js";

export function getWinningSegmentIndex(segmentCount: number): number {
  const normalizedRotation = ((currentRotation % 360) + 360) % 360;
  const stepAngle = 360 / segmentCount;
  const adjustedRotation = (360 - normalizedRotation + 270) % 360;
  return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}

export function displayWinner(winnerName: string): void {
  const winnerElement = document.getElementById("winner");
  if (!winnerElement) return;

  winnerElement.textContent = `Winner: ${winnerName}`;
}
export function resetDisplayWinner(): void {
  const winnerElement = document.getElementById("winner");
  if (!winnerElement) return;

  winnerElement.textContent = "Winner: No result yet";
}

export function announceWinner(segmentCount: number): void {
  stopDrumRoll();

  const winnerIndex = getWinningSegmentIndex(segmentCount);
  const names = getNames();
  const winnerName = names[winnerIndex];

  displayWinner(winnerName);
}