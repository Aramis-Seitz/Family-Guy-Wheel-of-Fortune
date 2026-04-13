import { SPIN_START_DELAY, SPIN_END_DELAY } from "./constants.js";
import { wheelElement, input, addBtn, spinLeftBtn, spinRightBtn, multiplierValue, multiplierSlider } from "./dom.js";
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


function getSpinRelatedElements(): (HTMLButtonElement | HTMLInputElement | null)[] {
  return [ input, addBtn, spinLeftBtn, spinRightBtn ];
}

function disableElements(elements: (HTMLButtonElement | HTMLInputElement | null)[]): void {
  elements.forEach((element) => {
    if (element) {
      element.disabled = true;
      element.style.setProperty("opacity", "0.5");
      element.style.setProperty("cursor", "not-allowed");
      element.style.setProperty("pointer-events", "none");
    }
  });
}

function enableElements(elements: (HTMLButtonElement | HTMLInputElement | null)[]): void {
  elements.forEach((element) => {
    if (element) {
      element.disabled = false;
      element.style.removeProperty("opacity");
      element.style.removeProperty("cursor");
      element.style.removeProperty("pointer-events");
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
    
    const halfStep = stepAngle / 2;
    const previousSegmentIndex = Math.floor((((lastTickRotation + halfStep) % 360) + 360) % 360 / stepAngle);
    const currentSegmentIndex = Math.floor((((currentRotation + halfStep) % 360) + 360) % 360 / stepAngle);
    
    if (previousSegmentIndex !== currentSegmentIndex) {
      playTickSound();
    }

    lastTickRotation = currentRotation;

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
      const multiplier = getMultiplier();
      const boostedRanNum = ranNum * multiplier;

      console.log("Number from fs server:", ranNum);
      console.log("Multiplier:", multiplier);
      console.log("Boosted value:", boostedRanNum);

      spinWheel(boostedRanNum, direction);
      disableElements(getSpinRelatedElements());
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
    enableElements(getSpinRelatedElements());
    stopDrumRoll();
    resetDisplayWinner();
}

export function updateMultiplierDisplay(): void {
    if (!multiplierSlider || !multiplierValue) return;
    multiplierValue.textContent = multiplierSlider.value;
}

multiplierSlider?.addEventListener("input", updateMultiplierDisplay);
updateMultiplierDisplay();

export function getMultiplier(): number {
    if (!multiplierSlider) return 1;

    const value = parseFloat(multiplierSlider.value);
    return Number.isNaN(value) ? 1 : value;
}
