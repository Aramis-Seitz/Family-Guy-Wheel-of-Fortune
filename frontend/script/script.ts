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

function spinWheel(): void {
    const segmentCount = getSegmentCount();
    if (segmentCount < 2) return;

    const totalSpinSteps = Math.floor(Math.random() * MAX_SPIN_STEPS) + 1;
    const stepAngle: number = 360 / segmentCount;
    let completedSteps: number = 0;

    function performSpinStep(): void {
        currentRotation -= 1;
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
        const delay: number = SPIN_START_DELAY + (SPIN_END_DELAY - SPIN_START_DELAY) * (progress ** 2);
        setTimeout(performSpinStep, delay);
    }

    performSpinStep();
}

function resetWheelRotation(): void {
    currentRotation = 0;
    lastTickRotation = 0;
    updateWheelRotation();
}
