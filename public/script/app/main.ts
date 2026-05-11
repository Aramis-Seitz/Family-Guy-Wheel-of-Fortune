import { addBtn, input, spinLeftBtn, spinRightBtn } from "../shared/dom.js";
import {
  createRoomBtn, roomKeyInput, joinRoomBtn, leaveRoomBtn,
  roomKeyDisplay, roomInfo, playersList,
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { initInventory } from "../inventory/inventory.js";
import { addName, initNameList } from "../names/name-list.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import {
  initMultiplierSlider, initWheelControls, spinWheel,
  setSpinOverride, lockSpinButtons, unlockSpinButtons, getMultiplier,
} from "../wheel/spin.js";
import { initWinnerModal } from "../wheel/winner.js";
import { createRoom, joinRoom, spinRoom, subscribeToRoom, unsubscribeFromRoom } from "../room.js";
import { showToast } from "../shared/toast.js";
import type { Direction } from "../shared/types.js";

let activeRoomKey: string | null = null;
let isHost = false;
let pendingSpinToken = '';
let pendingSpinDirection: Direction = 'right';

function initNameControls(): void {
  addBtn.addEventListener("click", () => addName(input.value));
  input.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") addName(input.value);
  });
}

async function hasActiveSession(): Promise<boolean> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return Boolean(session);
}

function renderPlayers(players: string[]): void {
  if (!playersList) return;
  const list = playersList;
  list.innerHTML = '';
  players.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  });
}

function setRoomActive(roomKey: string, host: boolean): void {
  activeRoomKey = roomKey;
  isHost = host;
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  if (!host) {
    spinLeftBtn.classList.add('room-guest');
    spinRightBtn.classList.add('room-guest');
  }
}

function clearRoom(): void {
  unsubscribeFromRoom();
  setSpinOverride(null);
  activeRoomKey = null;
  isHost = false;
  pendingSpinToken = '';
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  spinLeftBtn.classList.remove('room-guest');
  spinRightBtn.classList.remove('room-guest');
  renderPlayers([]);
}

function handleRoomSpinEvent(lastSpin: number): void {
  lockSpinButtons();
  const token = pendingSpinToken;
  pendingSpinToken = '';
  const totalSteps = Math.round(lastSpin * getMultiplier());
  spinWheel(totalSteps, pendingSpinDirection, token);
}

async function handleRoomSpinClick(direction: Direction): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  pendingSpinDirection = direction;
  lockSpinButtons();
  try {
    const { spinToken } = await spinRoom(activeRoomKey);
    pendingSpinToken = spinToken;
    // Realtime callback triggers the actual spin for all players including host
  } catch (error) {
    console.error('[ROOM] Spin fehlgeschlagen:', error);
    unlockSpinButtons();
    showToast({ message: 'Spin fehlgeschlagen', type: 'error' });
  }
}

function initRoomControls(): void {
  createRoomBtn?.addEventListener('click', () => {
    void (async () => {
      try {
        const roomKey = await createRoom();
        setRoomActive(roomKey, true);
        setSpinOverride(handleRoomSpinClick);
        subscribeToRoom(roomKey, handleRoomSpinEvent, renderPlayers);
        showToast({ message: `Raum erstellt: ${roomKey}`, type: 'success' });
      } catch (error) {
        console.error('[ROOM] Erstellen fehlgeschlagen:', error);
        showToast({ message: 'Raum konnte nicht erstellt werden', type: 'error' });
      }
    })();
  });

  joinRoomBtn?.addEventListener('click', () => {
    void (async () => {
      const roomKey = roomKeyInput?.value.trim().toUpperCase() ?? '';
      if (!roomKey) return;
      try {
        const players = await joinRoom(roomKey);
        setRoomActive(roomKey, false);
        setSpinOverride(handleRoomSpinClick);
        subscribeToRoom(roomKey, handleRoomSpinEvent, renderPlayers);
        renderPlayers(players);
        showToast({ message: `Raum beigetreten: ${roomKey}`, type: 'success' });
      } catch (error) {
        console.error('[ROOM] Beitreten fehlgeschlagen:', error);
        showToast({ message: 'Raum nicht gefunden oder Fehler beim Beitreten', type: 'error' });
      }
    })();
  });

  leaveRoomBtn?.addEventListener('click', () => {
    clearRoom();
    showToast({ message: 'Raum verlassen', type: 'success' });
  });
}

async function initApp(): Promise<void> {
  if (!(await hasActiveSession())) {
    window.location.href = "/login.html";
    return;
  }

  initNameList();
  initNameControls();
  initMultiplierSlider();
  initWheelControls();
  initShareFeature();
  initWinnerModal();
  await initProfileUI();
  initInventory();
  initRoomControls();
}

void initApp();
