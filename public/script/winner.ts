import { getNames, removeNameByIndex } from "./name-list.js";
import { stopDrumRoll } from "./sound.js";
import { currentRotation, resetWheelRotation } from "./wheel-spin.js";
import { supabaseClient } from "./supabase-client.js";
import { refreshCoinDisplay } from "./profiles.js"; 

export function getWinningSegmentIndex(segmentCount: number): number {
  const normalizedRotation = ((currentRotation % 360) + 360) % 360;
  const stepAngle = 360 / segmentCount;
  const adjustedRotation = (360 - normalizedRotation + 270) % 360;
  return Math.floor(adjustedRotation / stepAngle) % segmentCount;
}

export function displayWinner(winnerName: string): void {
  const modal = document.getElementById("winnerModal");
  const text = document.getElementById("winnerText");

  if (!modal || !text) return;

  text.textContent = `${winnerName}`;
  modal.classList.remove("hidden");
}
export function resetDisplayWinner(): void {
  const modal = document.getElementById("winnerModal");
  if (!modal) return;

  modal.classList.add("hidden");
}

function startConfetti(): void {
  const canvas = document.getElementById("confettiCanvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 999 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 6 + 4,
    speed: Math.random() * 20 + 2,
    angle: Math.random() * Math.PI * 2,
    spin: Math.random() * 0.1 - 0.05,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  }));

  let running = true;

  function update() {
    if (!running) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle);
      p.angle += p.spin;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);

      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    });

    requestAnimationFrame(update);
  }

  update();

  setTimeout(() => {
    running = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 3000);
}

async function awardCoins(spinToken: string, winnerName: string): Promise<void> {
  if (!spinToken) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  try {
    const res=await fetch('/api/award-coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ spinToken, winnerName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('award-coins Fehler:', res.status, body);
      return;
    }
    await refreshCoinDisplay();
  } catch (err) {
    console.error('Failed to award coins:', err);
  }
}

let lastWinnerIndex: number = -1;

export function announceWinner(segmentCount: number, spinToken: string): void {
  stopDrumRoll();

  lastWinnerIndex = getWinningSegmentIndex(segmentCount);
  const names = getNames();
  const winnerName = names[lastWinnerIndex];

  displayWinner(winnerName);
  startConfetti();
  awardCoins(spinToken, winnerName);
}

export function setupWinnerModal(): void {
  const modal = document.getElementById("winnerModal");
  const closeBtn = document.getElementById("closeModal");
  const removeBtn = document.getElementById("removeWinner") as HTMLButtonElement;
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    resetWheelRotation();
  });

  removeBtn.addEventListener("click", () => {
    if (lastWinnerIndex >= 0) {
      removeNameByIndex(lastWinnerIndex);
      modal.classList.add("hidden");
      resetWheelRotation();
    }
  });
}
