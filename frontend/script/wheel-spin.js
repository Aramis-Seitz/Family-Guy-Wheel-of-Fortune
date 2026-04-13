import { SPIN_START_DELAY, SPIN_END_DELAY } from "./constants.js";
import { wheelElement, input, addBtn, spinLeftBtn, spinRightBtn, multiplierValue, multiplierSlider } from "./dom.js";
import { playTickSound, playDrumRoll, stopDrumRoll } from "./sound.js";
import { fetchRandomNumber } from "./api.js";
import { getSegmentCount, getNames } from "./name-list.js";
let currentRotation = 0;
let lastTickRotation = 0;
let spinCancelled = false;
function updateWheelRotation() {
    if (!wheelElement)
        return;
    wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}
function getWinningSegmentIndex(segmentCount) {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const stepAngle = 360 / segmentCount;
    const adjustedRotation = (360 - normalizedRotation + 270) % 360;
    return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}
function displayWinner(winnerName) {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement)
        return;
    winnerElement.textContent = `Winner: ${winnerName}`;
}
function resetDisplayWinner() {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement)
        return;
    winnerElement.textContent = "Winner: No result yet";
}
function getSpinRelatedElements() {
    return [input, addBtn, spinLeftBtn, spinRightBtn];
}
function disableElements(elements) {
    elements.forEach((element) => {
        if (element) {
            element.disabled = true;
            element.style.setProperty("opacity", "0.5");
            element.style.setProperty("cursor", "not-allowed");
            element.style.setProperty("pointer-events", "none");
        }
    });
}
function enableElements(elements) {
    elements.forEach((element) => {
        if (element) {
            element.disabled = false;
            element.style.removeProperty("opacity");
            element.style.removeProperty("cursor");
            element.style.removeProperty("pointer-events");
        }
    });
}
function spinWheel(totalSpinSteps, direction) {
    spinCancelled = false;
    const segmentCount = getSegmentCount();
    if (segmentCount < 2)
        return;
    const stepAngle = 360 / segmentCount;
    let completedSteps = 0;
    function performSpinStep() {
        if (spinCancelled)
            return;
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
export function spinWheelWithRandomSteps(direction) {
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
export function resetWheelRotation() {
    spinCancelled = true;
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
    enableElements(getSpinRelatedElements());
    stopDrumRoll();
    resetDisplayWinner();
}
export function updateMultiplierDisplay() {
    if (!multiplierSlider || !multiplierValue)
        return;
    multiplierValue.textContent = multiplierSlider.value;
}
multiplierSlider?.addEventListener("input", updateMultiplierDisplay);
updateMultiplierDisplay();
export function getMultiplier() {
    if (!multiplierSlider)
        return 1;
    const value = parseFloat(multiplierSlider.value);
    return Number.isNaN(value) ? 1 : value;
}
