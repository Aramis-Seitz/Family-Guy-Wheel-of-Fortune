let rotation: number = 0;
let lastTickAngle: number = 0;

const wheel = document.getElementById("wheel") as HTMLElement;

function generateWheel(): void {
    const n = parseInt(
        (document.getElementById("eckenInput") as HTMLInputElement).value
    );

    // Mindestwert prüfen
    if (n < 2) return;
    if (n == 8) {
        window.open("https://www.instagram.com/reel/CwxOa6ruvJE/", "_blank");
    }

    // SVG leeren
    wheel.innerHTML = "";

    const cx: number = 150;
    const cy: number = 150;
    const r: number = 100;

    const angleStep: number = (2 * Math.PI) / n;

    for (let i: number = 0; i < n; i++) {
        const startAngle: number = i * angleStep;
        const endAngle: number = (i + 1) * angleStep;

        const x1: number = cx + r * Math.cos(startAngle - Math.PI / 2);
        const y1: number = cy + r * Math.sin(startAngle - Math.PI / 2);

        const x2: number = cx + r * Math.cos(endAngle - Math.PI / 2);
        const y2: number = cy + r * Math.sin(endAngle - Math.PI / 2);

        const largeArc: number = angleStep > Math.PI ? 1 : 0;

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        path.setAttribute(
            "d",
            `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        );

        // zufällige Farbe
        path.setAttribute("fill", `hsl(${(i * 360) / n}, 100%, 50%)`);

        wheel.appendChild(path);
    }
}

function updateRotation(): void {
    wheel.style.transform = `rotate(${rotation}deg)`;
}

function playTick(): void {
    const sound = (document.getElementById("tickSound") as HTMLAudioElement).cloneNode() as HTMLAudioElement;
    sound.play();
}


function rotateLeft(): void {
    let power: number = 10; //kraft des spielers muss über ui z.b durch regler
    let wert: number = Math.floor(Math.random() * 960) + 1; // 960 bestimmt die max anzahl an umdrehungen
    let zahl: number = wert * power;
    let i: number = 0;
    console.log("Rotation:", zahl);
    const startDelay: number = 5/power; //beschleunigt die scheibe in abhängigkeit der spieler kraft
    const endDelay: number = 75;

    const n: number = parseInt(
        (document.getElementById("eckenInput") as HTMLInputElement).value
    );
    const stepAngle: number = 360 / n;

    function step(): void {
        rotation -= 1;
        updateRotation();

        i++;

        if (Math.abs(rotation - lastTickAngle) >= stepAngle) {
            playTick();
            lastTickAngle = rotation;
        }

        if (i >= zahl) return;

        const progress: number = i / zahl;
        const delay: number = startDelay + (endDelay - startDelay) * (progress * progress);

        setTimeout(step, delay);
    }

    step();
}

function resetRotation(): void {
    rotation = 0;
    updateRotation();
}