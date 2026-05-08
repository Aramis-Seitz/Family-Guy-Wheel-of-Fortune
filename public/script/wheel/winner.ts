import { awardCoins } from "../api/client.js";
import { getNames, removeNameByIndex } from "../names/name-list.js";
import { stopDrumRoll } from "./sound.js";
import { getCurrentRotation, resetWheelRotation } from "./spin.js";
import { refreshCoinDisplay } from "../profile/profiles.js";
import { showToast } from "../shared/toast.js";
import { winnerModal, closeWinnerModalBtn, removeWinnerBtn, winnerText, confettiCanvas } from "../shared/dom.js";

export function getWinningSegmentIndexForRotation(rotation: number, segmentCount: number): number {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const stepAngle = 360 / segmentCount;
  const adjustedRotation = (360 - normalizedRotation + 270) % 360;
  return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}

export function getWinningSegmentIndex(segmentCount: number): number {
  return getWinningSegmentIndexForRotation(getCurrentRotation(), segmentCount);
}

export function displayWinnerModal(winnerName: string): void {

  if (!winnerModal || !winnerText) return;

  winnerText.textContent = `${winnerName}`;
  winnerModal.classList.remove("hidden");
}

export function hideWinnerModal(): void {
  if (!winnerModal) return;
  winnerModal.classList.add("hidden");
}

function startConfetti(): void {
  if (!confettiCanvas) return;

  const ctx = confettiCanvas.getContext("2d");
  if (!ctx) return;

  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const pieces = Array.from({ length: 999 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    size: Math.random() * 6 + 4,
    speed: Math.random() * 20 + 2,
    angle: Math.random() * Math.PI * 2,
    spin: Math.random() * 0.1 - 0.05,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  }));

  let running = true;

  function update() {
    if (!running) return;

    const ctx = confettiCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    pieces.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle);
      p.angle += p.spin;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);

      if (p.y > confettiCanvas.height) {
        p.y = -10;
        p.x = Math.random() * confettiCanvas.width;
      }
    });

    requestAnimationFrame(update);
  }

  update();

  setTimeout(() => {
    running = false;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }, 3000);
}

let lastWinnerIndex: number = -1;
let lastWinnerName: string = "";

export function announceWinner(segmentCount: number, spinToken: string): void {
  stopDrumRoll();

  lastWinnerIndex = getWinningSegmentIndex(segmentCount);
  const names = getNames();
  const winnerName = names[lastWinnerIndex];
  lastWinnerName = winnerName;

  console.log("[SPIN] 🏆 Gewinner ermittelt:", { winnerName, spinToken: spinToken || "LEER" });

  displayWinnerModal(winnerName);
  startConfetti();
  awardCoins(spinToken, winnerName)
    .then((result) => {
      if (result) {
        console.log("[SPIN] ✅ Coins erfolgreich vergeben:", result);
      } else {
        console.warn("[SPIN] ⚠️ awardCoins hat null zurückgegeben – keine Coins vergeben");
      }
      return refreshCoinDisplay();
    })
    .catch((err: unknown) => {
      console.error("[SPIN] ❌ Fehler beim Vergeben von Coins:", err);
    });
}

function removeWinner(): void {
  if (lastWinnerIndex < 0) return;
  const removedName = lastWinnerName;
  if (getNames().length > 2) {
    showToast({
      message: `"${removedName}" wurde erfolgreich aus dem Rad entfernt.`,
      type: "success"
    });
  }

  removeNameByIndex(lastWinnerIndex);
  hideWinnerModal();
  resetWheelRotation();
}

export function initWinnerModal(): void {
  if (!winnerModal || !closeWinnerModalBtn) return;

  closeWinnerModalBtn.addEventListener("click", () => {
    hideWinnerModal();
    resetWheelRotation();
  });

  removeWinnerBtn.addEventListener("click", removeWinner);
}
