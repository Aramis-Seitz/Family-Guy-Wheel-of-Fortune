let rotation = 0;
let lastTickAngle = 0;

const wheel = document.getElementById("wheel");

function generateWheel() {
    const n = parseInt(document.getElementById("eckenInput").value);

    // Mindestwert prüfen
    if (n < 2) return;
    if (n == 8) {
    window.open("https://www.instagram.com/reel/CwxOa6ruvJE/", "_blank");
}

    // SVG leeren
    wheel.innerHTML = "";

    const cx = 150;
    const cy = 150;
    const r = 100;

    const angleStep = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
        const startAngle = i * angleStep;
        const endAngle = (i + 1) * angleStep;

        const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
        const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);

        const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
        const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);

        const largeArc = angleStep > Math.PI ? 1 : 0;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        path.setAttribute(
            "d",
            `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        );

        // zufällige Farbe
        path.setAttribute("fill", `hsl(${(i * 360) / n}, 100%, 50%)`);

        wheel.appendChild(path);
    }
}

function updateRotation() {
    wheel.style.transform = `rotate(${rotation}deg)`;
}

function playTick() {
    const sound = tickSound.cloneNode(); 
    sound.play();
}
function rotateLeft() {
    let zahl = Math.floor(Math.random() * 360) + 1;
    let i = 0;
    let delay = 40;

    const n = parseInt(document.getElementById("eckenInput").value);
    const stepAngle = 360 / n;

    function step() {
        rotation -= 1;
        updateRotation();
        i++;


        if (Math.abs(rotation - lastTickAngle) >= stepAngle) {
            playTick();
            lastTickAngle = rotation;
        }

        if (i >= zahl) return;

        delay *= 1.03;
        setTimeout(step, delay);
    }

    step();
}

function resetRotation() {
    rotation = 0;
    updateRotation();
}