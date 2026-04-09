"use strict";
const wheelElement = document.getElementById("wheel");
const segmentCountInput = document.getElementById("eckenInput");
const tickSoundTemplate = document.getElementById("tickSound");
let currentRotation = 0;
let lastTickRotation = 0;
const WHEEL_CENTER = { x: 150, y: 150 };
const WHEEL_RADIUS = 100;
const FULL_CIRCLE_RADIANS = Math.PI * 2;
const MAX_SPIN_STEPS = 960;
const SPIN_START_DELAY = 5;
const SPIN_END_DELAY = 75;
function getSegmentCount() {
    if (!segmentCountInput)
        return 0;
    const value = parseInt(segmentCountInput.value, 10);
    return Number.isNaN(value) ? 0 : value;
}
function clearWheel() {
    if (!wheelElement)
        return;
    wheelElement.innerHTML = "";
}
function getPointOnCircle(center, radius, angleRadians) {
    return {
        x: center.x + radius * Math.cos(angleRadians - Math.PI / 2),
        y: center.y + radius * Math.sin(angleRadians - Math.PI / 2),
    };
}
function createWheelSegmentPath(segmentIndex, segmentCount) {
    const angleStep = FULL_CIRCLE_RADIANS / segmentCount;
    const startAngle = segmentIndex * angleStep;
    const endAngle = (segmentIndex + 1) * angleStep;
    const startPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, startAngle);
    const endPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, endAngle);
    const largeArcFlag = angleStep > Math.PI ? 1 : 0;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${WHEEL_CENTER.x} ${WHEEL_CENTER.y} L ${startPoint.x} ${startPoint.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z`);
    path.setAttribute("fill", `hsl(${(segmentIndex * 360) / segmentCount}, 100%, 50%)`);
    return path;
}
function generateWheel() {
    const segmentCount = getSegmentCount();
    if (segmentCount < 2 || !wheelElement)
        return;
    if (segmentCount === 8) {
        window.open("https://www.instagram.com/reel/CwxOa6ruvJE/", "_blank");
    }
    clearWheel();
    for (let index = 0; index < segmentCount; index += 1) {
        const segmentPath = createWheelSegmentPath(index, segmentCount);
        wheelElement.appendChild(segmentPath);
    }
}
function updateWheelRotation() {
    if (!wheelElement)
        return;
    wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}
function playTickSound() {
    if (!tickSoundTemplate)
        return;
    const tickSound = tickSoundTemplate.cloneNode(true);
    tickSound.play();
}
function spinWheel(totalSpinSteps, direction) {
    const segmentCount = getSegmentCount();
    if (segmentCount < 2)
        return;
    const stepAngle = 360 / segmentCount;
    let completedSteps = 0;
    function performSpinStep() {
        currentRotation += direction === "right" ? 1 : -1;
        updateWheelRotation();
        completedSteps += 1;
        if (Math.abs(currentRotation - lastTickRotation) >= stepAngle) {
            playTickSound();
            lastTickRotation = currentRotation;
        }
        if (completedSteps >= totalSpinSteps) {
            return;
        }
        const progress = completedSteps / totalSpinSteps;
        const delay = SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 3);
        setTimeout(performSpinStep, delay);
    }
    performSpinStep();
}
window.getRandomNumber = getRandomNumber_left;
window.getRandomNumber = getRandomNumber_right;
window.generateWheel = generateWheel;
window.resetWheelRotation = resetWheelRotation;
async function getRandomNumber_left() {
    try {
        const response = await fetch("/api/random");
        if (!response.ok) {
            throw new Error("Server response not ok.");
        }
        const data = await response.json();
        console.log("Number from se server:", data.ranNum);
        spinWheel(data.ranNum, "right");
    }
    catch (error) {
        console.error("error whilst getting random value:", error);
    }
}
async function getRandomNumber_right() {
    try {
        const response = await fetch("/api/random");
        if (!response.ok) {
            throw new Error("Server response not ok.");
        }
        const data = await response.json();
        console.log("Number from se server:", data.ranNum);
        spinWheel(data.ranNum, "left");
    }
    catch (error) {
        console.error("error whilst getting random value:", error);
    }
}
function resetWheelRotation() {
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
}
const MIN_ITEMS = 2;
const input = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("nameList");
const errorHint = document.getElementById("errorHint");
const emptyHint = document.getElementById("emptyHint");
function getItemCount() {
    return list.querySelectorAll(".name-item").length;
}
function syncRemoveButtons() {
    const tooFew = getItemCount() <= MIN_ITEMS;
    list.querySelectorAll(".btn-remove").forEach((btn) => {
        btn.disabled = tooFew;
    });
}
function updateEmptyState() {
    emptyHint.style.display = getItemCount() === 0 ? "block" : "none";
}
let errorTimer = null;
function showError() {
    errorHint.classList.remove("hidden");
    if (errorTimer)
        clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorHint.classList.add("hidden"), 2000);
}
function handleRemove(item) {
    if (getItemCount() <= MIN_ITEMS) {
        item.classList.remove("shake");
        void item.offsetWidth; // reflow
        item.classList.add("shake");
        item.addEventListener("animationend", () => item.classList.remove("shake"), { once: true });
        showError();
        return;
    }
    item.remove();
    updateEmptyState();
    syncRemoveButtons();
}
function attachRemoveListener(btn, item) {
    btn.addEventListener("click", () => handleRemove(item));
}
function addName(rawName) {
    const name = rawName.trim();
    if (!name)
        return;
    const li = document.createElement("li");
    li.className = "name-item";
    const span = document.createElement("span");
    span.className = "name-text";
    span.textContent = name;
    const btn = document.createElement("button");
    btn.className = "btn-remove";
    btn.textContent = "−";
    attachRemoveListener(btn, li);
    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
    updateEmptyState();
    syncRemoveButtons();
    input.value = "";
    input.focus();
}
// Bootstrap existing items
list.querySelectorAll(".name-item").forEach((item) => {
    const btn = item.querySelector(".btn-remove");
    if (btn)
        attachRemoveListener(btn, item);
});
addBtn.addEventListener("click", () => addName(input.value));
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
        addName(input.value);
});
syncRemoveButtons();
updateEmptyState();
