import { SPIN_START_DELAY, SPIN_END_DELAY } from "./constants.js";
import { wheelElement } from "./dom.js";
import { playTickSound, playDrumRoll, stopDrumRoll } from "./sound.js";
import { fetchRandomNumber } from "./api.js";
import { getSegmentCount, getNames } from "./name-list.js";


let currentRotation = 0;
let lastTickRotation = 0;
let spinCancelled = false;

function updateWheelRotation(): void {
  if (!wheelElement) return;
  wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}

function getWinningSegmentIndex(segmentCount: number): number {
  const normalizedRotation = ((currentRotation % 360) + 360) % 360;
  const stepAngle = 360 / segmentCount;
  const adjustedRotation = (360 - normalizedRotation + 270) % 360;
  return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}

function displayWinner(winnerName: string): void {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement) return;

    winnerElement.textContent = `Winner: ${winnerName}`;
}
function resetDisplayWinner(): void {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement) return;

    winnerElement.textContent = "Winner: No result yet";
}


function disableSpinButtons(): void {
  const leftBtn = document.getElementById("spin-left-btn") as HTMLButtonElement | null;
  const rightBtn = document.getElementById("spin-right-btn") as HTMLButtonElement | null;

  [rightBtn, leftBtn].forEach((button) => {
    if (button) {
      button.disabled = true;
      button.style.setProperty("opacity", "0.5");
      button.style.setProperty("cursor", "not-allowed");
      button.style.setProperty("pointer-events", "none");
    }
  });
}

function enableSpinButtons(): void {
  const leftBtn = document.getElementById("spin-left-btn") as HTMLButtonElement | null;
  const rightBtn = document.getElementById("spin-right-btn") as HTMLButtonElement | null;

  [rightBtn, leftBtn].forEach((button) => {
    if (button) {
      button.disabled = false;
      button.style.removeProperty("opacity");
      button.style.removeProperty("cursor");
      button.style.removeProperty("pointer-events");
    }
  });
}

function spinWheel(totalSpinSteps: number, direction: "left" | "right"): void {
  spinCancelled = false;

  const segmentCount = getSegmentCount();
  if (segmentCount < 2) return;

  const stepAngle = 360 / segmentCount;
  let completedSteps = 0;

  function performSpinStep(): void {
    if (spinCancelled) return;

    currentRotation += direction === "right" ? 1 : -1;
    updateWheelRotation();
    completedSteps += 1;

    if (Math.abs(currentRotation - lastTickRotation) >= stepAngle) {
      playTickSound();
      lastTickRotation = currentRotation;
    }

    if (completedSteps >= totalSpinSteps) {
        stopDrumRoll();

        const winnerIndex = getWinningSegmentIndex(segmentCount);
        const names = getNames();
        const winnerName = names[winnerIndex];

        displayWinner(winnerName);
        return;
    }

    const progress = completedSteps / totalSpinSteps;
    const delay = SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 4);

    if (delay > 50) {
      playDrumRoll();
    }

    setTimeout(performSpinStep, delay);
  }

  performSpinStep();
}

export function spinWheelWithRandomSteps(direction: "left" | "right"): void {
  fetchRandomNumber()
    .then((ranNum) => {
      console.log("Number from server:", ranNum);
      spinWheel(ranNum, direction);
      disableSpinButtons();
    })
    .catch((error) => {
      console.error("Error while getting random value:", error);
    });
}

export function resetWheelRotation(): void {
    spinCancelled = true;
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
    enableSpinButtons();
    stopDrumRoll();
    resetDisplayWinner();
}
