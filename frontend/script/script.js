"use strict";
const wheelElement = document.getElementById("wheel");
const tickSoundTemplate = document.getElementById("tickSound");
const input = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("nameList");
const errorHint = document.getElementById("errorHint");
const emptyHint = document.getElementById("emptyHint");
let currentRotation = 0;
let lastTickRotation = 0;
const WHEEL_CENTER = { x: 150, y: 150 };
const WHEEL_RADIUS = 100;
const FULL_CIRCLE_RADIANS = Math.PI * 2;
const SPIN_START_DELAY = 5;
const SPIN_END_DELAY = 75;
const MIN_ITEMS = 2;
const SEGMENT_COLORS = [
    "#f4d87e",
    "#f4a96b",
    "#f4a0a0",
    "#a8d8f0",
    "#c5b8f0",
    "#ae945d",
    "#8a78c5",
    "#745bc6",
    "#312260",
    "#1f1542",
    "#3c287b",
    "rgb(141, 116, 225)",
    "#504672"
];
function getNames() {
    return Array.from(list.querySelectorAll(".name-text"))
        .map((element) => element.textContent?.trim() || "")
        .filter((name) => name.length > 0);
}
function getSegmentCount() {
    return getNames().length;
}
function getSegmentColor(index) {
    return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}
function applyItemColor(item, index) {
    item.style.backgroundColor = getSegmentColor(index);
}
function updateListColors() {
    const items = list.querySelectorAll(".name-item");
    items.forEach((item, index) => {
        applyItemColor(item, index);
    });
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
function createWheelSegmentPath(segmentIndex, segmentCount, color) {
    const angleStep = FULL_CIRCLE_RADIANS / segmentCount;
    const startAngle = segmentIndex * angleStep;
    const endAngle = (segmentIndex + 1) * angleStep;
    const startPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, startAngle);
    const endPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, endAngle);
    const largeArcFlag = angleStep > Math.PI ? 1 : 0;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${WHEEL_CENTER.x} ${WHEEL_CENTER.y} L ${startPoint.x} ${startPoint.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z`);
    path.setAttribute("fill", color);
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "1");
    return path;
}
function createWheelLabel(segmentIndex, segmentCount, name) {
    const angleStep = FULL_CIRCLE_RADIANS / segmentCount;
    const middleAngle = (segmentIndex + 0.5) * angleStep;
    const labelRadius = WHEEL_RADIUS * 0.62;
    const labelPoint = getPointOnCircle(WHEEL_CENTER, labelRadius, middleAngle);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(labelPoint.x));
    text.setAttribute("y", String(labelPoint.y));
    text.setAttribute("fill", "black");
    text.setAttribute("font-size", "10");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    const angleInDegrees = (middleAngle * 180) / Math.PI;
    const readableRotation = angleInDegrees > 180 ? angleInDegrees + 90 : angleInDegrees - 90;
    text.setAttribute("transform", `rotate(${readableRotation} ${labelPoint.x} ${labelPoint.y})`);
    text.textContent = name;
    return text;
}
function generateWheel() {
    const names = getNames();
    const segmentCount = names.length;
    if (segmentCount < 2 || !wheelElement)
        return;
    clearWheel();
    names.forEach((name, index) => {
        const color = getSegmentColor(index);
        const segmentPath = createWheelSegmentPath(index, segmentCount, color);
        const label = createWheelLabel(index, segmentCount, name);
        wheelElement.appendChild(segmentPath);
        wheelElement.appendChild(label);
    });
}
function refreshWheel() {
    updateListColors();
    generateWheel();
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
let spinCancelled = false;
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
        if (Math.abs(currentRotation - lastTickRotation) >= stepAngle) {
            playTickSound();
            lastTickRotation = currentRotation;
        }
        if (completedSteps >= totalSpinSteps) {
            return;
        }
        const progress = completedSteps / totalSpinSteps;
        const delay = SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 4);
        /*
                function playDrumRoll();
                    // IF delay >= 200 play
                    function playTickSound(): void {
                        if (!tickSoundTemplate) return;
                        const tickSound = tickSoundTemplate.cloneNode(true) as HTMLAudioElement;
                        tickSound.play();
                    }
            
                function stopDrumRoll();
        
                    if (completedSteps >= totalSpinSteps) {
                        //stop drumroll;
                }
        */
        setTimeout(performSpinStep, delay);
    }
    if (completedSteps >= totalSpinSteps) {
        const winnerIndex = getWinningSegmentIndex(segmentCount);
        displayWinner(winnerIndex);
        return;
    }
    performSpinStep();
}
function getWinningSegmentIndex(segmentCount) {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const stepAngle = 360 / segmentCount;
    // +90°, weil Pointer links ist (9 Uhr)
    const adjustedRotation = (360 - normalizedRotation + 90) % 360;
    const index = Math.floor(adjustedRotation / stepAngle) % segmentCount;
    return index;
}
function displayWinner(index) {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement)
        return;
    winnerElement.textContent = `Gewinner: Segment ${index + 1}`;
}
function spinWheelWithRandomSteps(direction) {
    const apiEndpoint = direction === "left" ? "/api/random" : "/api/random";
    fetch(apiEndpoint)
        .then((response) => {
        if (!response.ok) {
            throw new Error("Server response not ok.");
        }
        return response.json();
    })
        .then((data) => {
        console.log("Number from server:", data.ranNum);
        spinWheel(data.ranNum, direction);
        disableSpinButtons();
    })
        .catch((error) => {
        console.error("Error while getting random value:", error);
    });
}
function resetWheelRotation() {
    spinCancelled = true;
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
    enableSpinButtons();
}
function disableSpinButtons() {
    const leftBtn = document.getElementById("spin-left-btn");
    const rightBtn = document.getElementById("spin-right-btn");
    if (leftBtn) {
        leftBtn.disabled = true;
        leftBtn.style.setProperty("opacity", "0.5");
        leftBtn.style.setProperty("cursor", "not-allowed");
        leftBtn.style.setProperty("pointer-events", "none");
    }
    if (rightBtn) {
        rightBtn.disabled = true;
        rightBtn.style.setProperty("opacity", "0.5");
        rightBtn.style.setProperty("cursor", "not-allowed");
        rightBtn.style.setProperty("pointer-events", "none");
    }
}
function enableSpinButtons() {
    const leftBtn = document.getElementById("spin-left-btn");
    const rightBtn = document.getElementById("spin-right-btn");
    if (leftBtn) {
        leftBtn.disabled = false;
        leftBtn.style.removeProperty("opacity");
        leftBtn.style.removeProperty("cursor");
        leftBtn.style.removeProperty("pointer-events");
    }
    if (rightBtn) {
        rightBtn.disabled = false;
        rightBtn.style.removeProperty("opacity");
        rightBtn.style.removeProperty("cursor");
        rightBtn.style.removeProperty("pointer-events");
    }
}
// Helferfunktionen für die Namensliste
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
        void item.offsetWidth;
        item.classList.add("shake");
        item.addEventListener("animationend", () => item.classList.remove("shake"), { once: true });
        showError();
        return;
    }
    item.remove();
    updateEmptyState();
    syncRemoveButtons();
    refreshWheel();
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
    refreshWheel();
    input.value = "";
    input.focus();
}
list.querySelectorAll(".name-item").forEach((item) => {
    const btn = item.querySelector(".btn-remove");
    if (btn) {
        attachRemoveListener(btn, item);
    }
});
addBtn.addEventListener("click", () => addName(input.value));
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addName(input.value);
    }
});
function getRandomNumber_left() {
    spinWheelWithRandomSteps("left");
}
function getRandomNumber_right() {
    spinWheelWithRandomSteps("right");
}
window.getRandomNumber_left = getRandomNumber_left;
window.getRandomNumber_right = getRandomNumber_right;
window.generateWheel = generateWheel;
window.resetWheelRotation = resetWheelRotation;
syncRemoveButtons();
updateEmptyState();
refreshWheel();
