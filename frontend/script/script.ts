interface Point {
    x: number;
    y: number;
}

const wheelElement = document.getElementById("wheel") as HTMLElement | null;
const segmentCountInput = document.getElementById("eckenInput") as HTMLInputElement | null;
const tickSoundTemplate = document.getElementById("tickSound") as HTMLAudioElement | null;

let currentRotation: number = 0;
let lastTickRotation: number = 0;

const WHEEL_CENTER: Point = { x: 150, y: 150 };
const WHEEL_RADIUS: number = 100;
const FULL_CIRCLE_RADIANS: number = Math.PI * 2;
const MAX_SPIN_STEPS: number = 960;
const SPIN_START_DELAY: number = 5;
const SPIN_END_DELAY: number = 75;

function getSegmentCount(): number {
    if (!segmentCountInput) return 0;
    const value = parseInt(segmentCountInput.value, 10);
    return Number.isNaN(value) ? 0 : value;
}

function clearWheel(): void {
    if (!wheelElement) return;
    wheelElement.innerHTML = "";
}

function getPointOnCircle(center: Point, radius: number, angleRadians: number): Point {
    return {
        x: center.x + radius * Math.cos(angleRadians - Math.PI / 2),
        y: center.y + radius * Math.sin(angleRadians - Math.PI / 2),
    };
}

function createWheelSegmentPath(segmentIndex: number, segmentCount: number): SVGPathElement {
    const angleStep: number = FULL_CIRCLE_RADIANS / segmentCount;
    const startAngle: number = segmentIndex * angleStep;
    const endAngle: number = (segmentIndex + 1) * angleStep;

    const startPoint: Point = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, startAngle);
    const endPoint: Point = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, endAngle);
    const largeArcFlag: number = angleStep > Math.PI ? 1 : 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${WHEEL_CENTER.x} ${WHEEL_CENTER.y} L ${startPoint.x} ${startPoint.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z`
    );
    path.setAttribute("fill", `hsl(${(segmentIndex * 360) / segmentCount}, 100%, 50%)`);
    return path;
}

function generateWheel(): void {
    const segmentCount = getSegmentCount();
    if (segmentCount < 2 || !wheelElement) return;

    if (segmentCount === 8) {
        window.open("https://www.instagram.com/reel/CwxOa6ruvJE/", "_blank");
    }

    clearWheel();

    for (let index = 0; index < segmentCount; index += 1) {
        const segmentPath = createWheelSegmentPath(index, segmentCount);
        wheelElement.appendChild(segmentPath);
    }
}

function updateWheelRotation(): void {
    if (!wheelElement) return;
    wheelElement.style.transform = `rotate(${currentRotation}deg)`;
}

function playTickSound(): void {
    if (!tickSoundTemplate) return;
    const tickSound = tickSoundTemplate.cloneNode(true) as HTMLAudioElement;
    tickSound.play();
}

function spinWheel(totalSpinSteps: number, direction: "left" | "right"): void {
    const segmentCount = getSegmentCount();
    if (segmentCount < 2) return;

    const stepAngle: number = 360 / segmentCount;
    let completedSteps: number = 0;

    function performSpinStep(): void {
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

        const progress: number = completedSteps / totalSpinSteps;
        const delay: number =
            SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 3);

        setTimeout(performSpinStep, delay);
    }

    performSpinStep();
}
(window as any).getRandomNumber = getRandomNumber_left;
(window as any).getRandomNumber = getRandomNumber_right;
(window as any).generateWheel = generateWheel;
(window as any).resetWheelRotation = resetWheelRotation;

async function getRandomNumber_left(): Promise<void> {
    try {
        const response = await fetch("/api/random");

        if (!response.ok) {
            throw new Error("Server response not ok.");
        }

        const data: { ranNum: number } = await response.json();

        console.log("Number from se server:", data.ranNum);

        spinWheel(data.ranNum, "right");
    } catch (error) {
        console.error("error whilst getting random value:", error);
    }
}

async function getRandomNumber_right(): Promise<void> {
    try {
        const response = await fetch("/api/random");

        if (!response.ok) {
            throw new Error("Server response not ok.");
        }

        const data: { ranNum: number } = await response.json();

        console.log("Number from se server:", data.ranNum);

        spinWheel(data.ranNum, "left");
    } catch (error) {
        console.error("error whilst getting random value:", error);
    }
}

function resetWheelRotation(): void {
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
}

const MIN_ITEMS: number = 2;

const input = document.getElementById("nameInput") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const list = document.getElementById("nameList") as HTMLUListElement;
const errorHint = document.getElementById("errorHint") as HTMLParagraphElement;
const emptyHint = document.getElementById("emptyHint") as HTMLParagraphElement;

function getItemCount(): number {
    return list.querySelectorAll(".name-item").length;
}

function syncRemoveButtons(): void {
    const tooFew: boolean = getItemCount() <= MIN_ITEMS;
    list.querySelectorAll<HTMLButtonElement>(".btn-remove").forEach((btn) => {
        btn.disabled = tooFew;
    });
}

function updateEmptyState(): void {
    emptyHint.style.display = getItemCount() === 0 ? "block" : "none";
}

let errorTimer: ReturnType<typeof setTimeout> | null = null;

function showError(): void {
    errorHint.classList.remove("hidden");
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorHint.classList.add("hidden"), 2000);
}

function handleRemove(item: HTMLLIElement): void {
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

function attachRemoveListener(btn: HTMLButtonElement, item: HTMLLIElement): void {
    btn.addEventListener("click", () => handleRemove(item));
}

function addName(rawName: string): void {
    const name = rawName.trim();
    if (!name) return;
    const li = document.createElement("li") as HTMLLIElement;
    li.className = "name-item";
    const span = document.createElement("span");
    span.className = "name-text";
    span.textContent = name;
    const btn = document.createElement("button") as HTMLButtonElement;
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
list.querySelectorAll<HTMLLIElement>(".name-item").forEach((item) => {
    const btn = item.querySelector<HTMLButtonElement>(".btn-remove");
    if (btn) attachRemoveListener(btn, item);
});

addBtn.addEventListener("click", () => addName(input.value));
input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") addName(input.value);
});

syncRemoveButtons();
updateEmptyState();