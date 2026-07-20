import { isMultiplayerActive, isRoomHost } from "../room";
import { awardCoins } from "../api/spin-api";
import { getNamesInWheelList, removeNameFromListByIndex } from "../names/names-in-wheel-list";
import { stopDrumRoll } from "./sound";
import { resetWheelRotation } from "./spin";
import { disableMultiplierSlider } from "./multiplier";
import { refreshCoinDisplay } from "../profile/profiles";
import { showToast } from "../shared/toast";
import { requiredElement } from "../shared/dom-helpers";
import type { SpinConfig } from "./spin";

export const POINTER_OFFSET_DEG: number = 270;
export const FULL_CIRCLE_DEG: number = 360;

export function resolveWinner(rotation: number, config: SpinConfig): string {
  const pointerAngle = ((POINTER_OFFSET_DEG - rotation) % FULL_CIRCLE_DEG + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  const winnerIndex = Math.floor(pointerAngle / config.stepAngle) % config.segmentCount;
  return config.names[winnerIndex] ?? config.names[0];
}

export const winnerModal = requiredElement<HTMLDivElement>("winner-modal");
export const winnerText = requiredElement<HTMLParagraphElement>("winner-modal-text");
export const removeWinnerBtn = requiredElement<HTMLButtonElement>("winner-modal-remove-btn");

export function displayWinnerModal(winnerName: string): void {
  if (!winnerModal || !winnerText) return;
  winnerText.textContent = `${winnerName}`;
  winnerModal.classList.remove("hidden");

  if (isMultiplayerActive()) {
    removeWinnerBtn.classList.add("hidden");
  } else {
    removeWinnerBtn.classList.remove("hidden");
    removeWinnerBtn.addEventListener("click", removeWinner);
  }
}

export function hideWinnerModal(): void {
  if (!winnerModal) return;
  winnerModal.classList.add("hidden");
}

const confettiCanvas = requiredElement<HTMLCanvasElement>("winner-modal-confetti-canvas");

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

let lastWinnerName: string = "";

export function announceWinner(spinToken: string, winnerName: string): void {
  stopDrumRoll();
  lastWinnerName = winnerName;
  displayWinnerModal(winnerName);
  startConfetti();

  awardCoins(spinToken, winnerName)
    .then((result) => {
      if (result) {
        return refreshCoinDisplay();
      }
      setTimeout(() => void refreshCoinDisplay(), 4000);
    })
    .catch((err: unknown) => {
      console.error("[SPIN] Fehler beim Vergeben von Coins:", err);
    });
}

function removeWinner(): void {
  if (!lastWinnerName) return;
  const removedName = lastWinnerName;
  const names = getNamesInWheelList();
  const index = names.indexOf(removedName);

  if (index < 0) {
    hideWinnerModal();
    resetWheelRotation();
    return;
  }

  if (names.length > 2) {
    showToast({
      message: `"${removedName}" wurde erfolgreich aus dem Rad entfernt.`,
      type: "success"
    });
  }

  removeNameFromListByIndex(index);
  hideWinnerModal();
  resetWheelRotation();
}

const closeWinnerModalBtn = requiredElement<HTMLButtonElement>("winner-modal-close-btn");

let activeCloseOverride: (() => void) | null = null;

export function setWinnerModalCloseOverride(handler: (() => void) | null): void {
  activeCloseOverride = handler;
}

function closeWinnerModalLocally(): void {
  hideWinnerModal();
  resetWheelRotation();
  if (isMultiplayerActive() && !isRoomHost()) {
    disableMultiplierSlider();
  }
}

export function initWinnerModal(): void {
  if (!winnerModal || !closeWinnerModalBtn) return;

  closeWinnerModalBtn.addEventListener("click", () => {
    (activeCloseOverride ?? closeWinnerModalLocally)();
  });
}
