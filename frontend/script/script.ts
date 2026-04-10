interface Point {
    x: number;
    y: number;
}

const wheelElement = document.getElementById("wheel") as SVGGElement | null;
const tickSoundTemplate = document.getElementById("tickSound") as HTMLAudioElement | null;
const input = document.getElementById("nameInput") as HTMLInputElement;
const addBtn = document.getElementById("addBtn") as HTMLButtonElement;
const list = document.getElementById("nameList") as HTMLUListElement;
const errorHint = document.getElementById("errorHint") as HTMLParagraphElement;
const emptyHint = document.getElementById("emptyHint") as HTMLParagraphElement;

let currentRotation: number = 0;
let lastTickRotation: number = 0;

const WHEEL_CENTER: Point = { x: 150, y: 150 };
const WHEEL_RADIUS: number = 100;
const FULL_CIRCLE_RADIANS: number = Math.PI * 2;
const SPIN_START_DELAY: number = 5;
const SPIN_END_DELAY: number = 75;

const MIN_ITEMS: number = 2;

const SEGMENT_COLORS: string[] = [ // aus css entfernt und hier eingefügt
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

function getNames(): string[] {
    return Array.from(list.querySelectorAll(".name-text"))
        .map((element) => element.textContent?.trim() || "")
        .filter((name) => name.length > 0);
}

function getSegmentCount(): number {
    return getNames().length;
}

function getSegmentColor(index: number): string {
    return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

function applyItemColor(item: HTMLLIElement, index: number): void {
    item.style.backgroundColor = getSegmentColor(index);
}

function updateListColors(): void {
    const items = list.querySelectorAll<HTMLLIElement>(".name-item");
    items.forEach((item, index) => {
        applyItemColor(item, index);
    });
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

function createWheelSegmentPath(segmentIndex: number, segmentCount: number, color: string): SVGPathElement {
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
    path.setAttribute("fill", color);
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "1");

    return path;
}

function createWheelLabel(segmentIndex: number, segmentCount: number, name: string): SVGTextElement {
    const angleStep: number = FULL_CIRCLE_RADIANS / segmentCount;
    const middleAngle: number = (segmentIndex + 0.5) * angleStep;

    const labelRadius: number = WHEEL_RADIUS * 0.62;
    const labelPoint: Point = getPointOnCircle(WHEEL_CENTER, labelRadius, middleAngle);

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

    text.setAttribute(
        "transform",
        `rotate(${readableRotation} ${labelPoint.x} ${labelPoint.y})`
    );

    text.textContent = name;

    return text;
}

function generateWheel(): void {
    const names = getNames();
    const segmentCount = names.length;

    if (segmentCount < 2 || !wheelElement) return;

    clearWheel();

    names.forEach((name, index) => {
        const color = getSegmentColor(index);
        const segmentPath = createWheelSegmentPath(index, segmentCount, color);
        const label = createWheelLabel(index, segmentCount, name);

        wheelElement.appendChild(segmentPath);
        wheelElement.appendChild(label);
    });
}

function refreshWheel(): void {
    updateListColors();
    generateWheel();
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

let spinCancelled: boolean = false;

function spinWheel(totalSpinSteps: number, direction: "left" | "right"): void {
    spinCancelled = false;
    
    const segmentCount = getSegmentCount();
    if (segmentCount < 2) return;

    const stepAngle: number = 360 / segmentCount;
    let completedSteps: number = 0;

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
            return;
        }

        const progress: number = completedSteps / totalSpinSteps;
        const delay: number =
            SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 4);
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

function getWinningSegmentIndex(segmentCount: number): number {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const stepAngle = 360 / segmentCount;

    // +90°, weil Pointer links ist (9 Uhr)
    const adjustedRotation = (360 - normalizedRotation + 90) % 360;

    const index = Math.floor(adjustedRotation / stepAngle) % segmentCount;

    return index;
}

function displayWinner(index: number): void {
    const winnerElement = document.getElementById("winner");
    if (!winnerElement) return;

    winnerElement.textContent = `Gewinner: Segment ${index + 1}`;
}

async function getRandomNumber_left(): Promise<void> {
    try {
        const response = await fetch("/api/random");

        if (!response.ok) {
            throw new Error("Server response not ok.");
        }

        const data: { ranNum: number } = await response.json();

        console.log("Number from se server:", data.ranNum);

        spinWheel(data.ranNum, "right");

        disableSpinButtons();
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

        disableSpinButtons();
    } catch (error) {
        console.error("error whilst getting random value:", error);
    }
}

function resetWheelRotation(): void {
    spinCancelled = true;
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
    enableSpinButtons();
}

function disableSpinButtons() {
    const leftBtn = document.getElementById("spin-left-btn") as HTMLButtonElement | null;
    const rightBtn = document.getElementById("spin-right-btn") as HTMLButtonElement | null;
    if (leftBtn) {
        leftBtn.disabled = true;
        leftBtn?.style.setProperty("opacity", "0.5");
        leftBtn?.style.setProperty("cursor", "not-allowed");
        leftBtn?.style.setProperty("pointer-events", "none");
        leftBtn?.style.setProperty("hover", "none");
        leftBtn?.style.setProperty("active", "none");
    }
    if (rightBtn) {
        rightBtn.disabled = true;
        rightBtn?.style.setProperty("opacity", "0.5");
        rightBtn?.style.setProperty("cursor", "not-allowed");
        rightBtn?.style.setProperty("pointer-events", "none");
        rightBtn?.style.setProperty("hover", "none");
        rightBtn?.style.setProperty("active", "none");        
    }
}

function enableSpinButtons() {
    const leftBtn = document.getElementById("spin-left-btn") as HTMLButtonElement | null;
    const rightBtn = document.getElementById("spin-right-btn") as HTMLButtonElement | null;
    if (leftBtn) {
        leftBtn.disabled = false;
        leftBtn?.style.removeProperty("opacity");
        leftBtn?.style.removeProperty("cursor");
        leftBtn?.style.removeProperty("pointer-events");
        leftBtn?.style.removeProperty("hover");
        leftBtn?.style.removeProperty("active");
    }
    if (rightBtn) {
        rightBtn.disabled = false;
        rightBtn?.style.removeProperty("opacity");
        rightBtn?.style.removeProperty("cursor");
        rightBtn?.style.removeProperty("pointer-events");
        rightBtn?.style.removeProperty("hover");
        rightBtn?.style.removeProperty("active");        
    }   
}


// Helferfunktionen für die Namensliste
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
    refreshWheel();
    input.value = "";
    input.focus();
}

list.querySelectorAll<HTMLLIElement>(".name-item").forEach((item) => {
    const btn = item.querySelector<HTMLButtonElement>(".btn-remove");
    if (btn) {
        attachRemoveListener(btn, item);
        }
});

addBtn.addEventListener("click", () => addName(input.value));
input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        addName(input.value);
        }
});

(window as any).getRandomNumber_left = getRandomNumber_left;
(window as any).getRandomNumber_right = getRandomNumber_right;
(window as any).generateWheel = generateWheel;
(window as any).resetWheelRotation = resetWheelRotation;

syncRemoveButtons();
updateEmptyState();
refreshWheel();