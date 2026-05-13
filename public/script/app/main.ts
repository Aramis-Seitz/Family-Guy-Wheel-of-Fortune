import { addBtn, input, spinLeftBtn, spinRightBtn } from "../shared/dom.js";
import {
  createRoomBtn, roomKeyInput, joinRoomBtn, leaveRoomBtn,
  roomKeyDisplay, roomInfo, playersList, copyRoomKeyBtn,
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { initInventory } from "../inventory/inventory.js";
import { addName, initNameList, getNames, replaceNames } from "../names/name-list.js";
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
let savedNames: string[] = [];

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

function renderPlayersSidebar(players: string[]): void {
  if (!playersList) return;
  const list = playersList;
  list.innerHTML = '';
  players.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  });
}

function syncRoomPlayers(players: string[]): void {
  replaceNames(players);
  renderPlayersSidebar(players);

  if (players.length < 2) {
    spinLeftBtn.classList.add('room-solo');
    spinRightBtn.classList.add('room-solo');
  } else {
    spinLeftBtn.classList.remove('room-solo');
    spinRightBtn.classList.remove('room-solo');
  }
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
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  spinLeftBtn.classList.remove('room-guest', 'room-solo');
  spinRightBtn.classList.remove('room-guest', 'room-solo');
  renderPlayersSidebar([]);
  replaceNames(savedNames);
}

// Non-host only: realtime fires → spin wheel visually (no coins)
function handleRoomSpinEvent(lastSpin: number): void {
  if (isHost) return; // host already spun directly from POST response
  lockSpinButtons();
  const totalSteps = Math.round(lastSpin * getMultiplier());
  spinWheel(totalSteps, 'right', '');
}

// Host only: POST → spin directly (token guaranteed, no race condition)
async function handleRoomSpinClick(direction: Direction): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  lockSpinButtons();
  try {
    const { ranNum, spinToken } = await spinRoom(activeRoomKey);
    const totalSteps = Math.round(ranNum * getMultiplier());
    spinWheel(totalSteps, direction, spinToken);
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
        savedNames = getNames();
        const { roomKey, players } = await createRoom();
        setRoomActive(roomKey, true);
        setSpinOverride(handleRoomSpinClick);
        syncRoomPlayers(players);
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers);
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
        savedNames = getNames();
        const players = await joinRoom(roomKey);
        setRoomActive(roomKey, false);
        setSpinOverride(handleRoomSpinClick);
        syncRoomPlayers(players);
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers);
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

  copyRoomKeyBtn?.addEventListener('click', () => {
    const btn = copyRoomKeyBtn;
    if (!btn) return;
    const key = roomKeyDisplay?.textContent ?? '';
    if (!key) return;
    void navigator.clipboard.writeText(key).then(() => {
      btn.classList.add('copied');
      btn.textContent = '✓';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '&#128203;';
      }, 1500);
      showToast({ message: 'Code in die Zwischenablage kopiert', type: 'success' });
    });
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
