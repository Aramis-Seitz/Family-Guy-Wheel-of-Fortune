import { addBtn, input, spinLeftBtn, spinRightBtn } from "../shared/dom.js";
import {
  createRoomBtn, roomKeyInput, joinRoomBtn, leaveRoomBtn,
  roomKeyDisplay, roomInfo, playersList, copyRoomKeyBtn,
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { initInventory } from "../inventory/inventory.js";
import { addName, initNameList, getNames, replaceNames, lockNameEditing, unlockNameEditing } from "../names/name-list.js";
import { nameState } from "../names/name-state.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import {
  initMultiplierSlider, initWheelControls, spinWheel,
  setSpinOverride, lockSpinButtons, unlockSpinButtons, getMultiplier,
} from "../wheel/spin.js";
import { initWinnerModal } from "../wheel/winner.js";
import { createRoom, joinRoom, spinRoom, closeRoom, subscribeToRoom, unsubscribeFromRoom } from "../room.js";
import { showToast } from "../shared/toast.js";
import type { Direction } from "../shared/types.js";

let activeRoomKey: string | null = null;
let isHost = false;
let savedNames: string[] = [];
let removedInRoom = new Set<string>();
let nameStateUnsubscribe: (() => void) | null = null;

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

function updateSpinButtonState(activeCount: number): void {
  if (activeCount < 2) {
    spinLeftBtn.classList.add('room-solo');
    spinRightBtn.classList.add('room-solo');
  } else {
    spinLeftBtn.classList.remove('room-solo');
    spinRightBtn.classList.remove('room-solo');
  }
}

// Called once when creating or joining a room — sets the wheel to exactly the room's player list.
function initRoomPlayers(players: string[]): void {
  removedInRoom.clear();
  replaceNames(players);
  renderPlayersSidebar(players);
  updateSpinButtonState(players.length);

  // Track manual removals so syncRoomPlayers can filter them out later.
  if (nameStateUnsubscribe) nameStateUnsubscribe();
  let prevNames = [...players];
  nameStateUnsubscribe = nameState.subscribe((names) => {
    if (!activeRoomKey) return;
    prevNames.filter(n => !names.includes(n)).forEach(n => removedInRoom.add(n));
    prevNames = [...names];
  });
}

// Called on Realtime player-list updates — only adds new players, never re-adds removed ones.
function syncRoomPlayers(players: string[]): void {
  const toShow = players.filter(p => !removedInRoom.has(p));
  replaceNames(toShow);
  renderPlayersSidebar(players);
  updateSpinButtonState(toShow.length);
}

function setRoomActive(roomKey: string, host: boolean): void {
  activeRoomKey = roomKey;
  isHost = host;
  lockNameEditing();
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  if (!host) {
    spinLeftBtn.classList.add('room-guest');
    spinRightBtn.classList.add('room-guest');
  }
}

function clearRoom(): void {
  if (nameStateUnsubscribe) {
    nameStateUnsubscribe();
    nameStateUnsubscribe = null;
  }
  removedInRoom.clear();
  unlockNameEditing();
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

// Non-host only: realtime fires → spin wheel visually (no coins, winner determined locally for display)
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
    const names = getNames();
    const { ranNum, spinToken } = await spinRoom(activeRoomKey, names);
    const totalSteps = Math.round(ranNum * getMultiplier());
    spinWheel(totalSteps, direction, spinToken);
  } catch (error) {
    console.error('[ROOM] Spin fehlgeschlagen:', error);
    unlockSpinButtons();
    showToast({ message: 'Spin fehlgeschlagen', type: 'error' });
  }
}

function onRoomClosed(): void {
  if (isHost) return; // host handles its own leave flow
  clearRoom();
  showToast({ message: 'Der Host hat den Raum geschlossen', type: 'error' });
}

function initRoomControls(): void {
  createRoomBtn?.addEventListener('click', () => {
    void (async () => {
      try {
        savedNames = getNames();
        const { roomKey, players } = await createRoom();
        setRoomActive(roomKey, true);
        setSpinOverride(handleRoomSpinClick);
        initRoomPlayers(players);
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers, onRoomClosed);
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
        initRoomPlayers(players);
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers, onRoomClosed);
        showToast({ message: `Raum beigetreten: ${roomKey}`, type: 'success' });
      } catch (error) {
        console.error('[ROOM] Beitreten fehlgeschlagen:', error);
        showToast({ message: 'Raum nicht gefunden oder Fehler beim Beitreten', type: 'error' });
      }
    })();
  });

  leaveRoomBtn?.addEventListener('click', () => {
    void (async () => {
      const wasHost = isHost;
      const roomKey = activeRoomKey;
      clearRoom(); // unsubscribe first so we don't receive our own close event
      if (wasHost && roomKey) {
        try {
          await closeRoom(roomKey);
          showToast({ message: 'Raum geschlossen', type: 'success' });
        } catch {
          showToast({ message: 'Raum konnte nicht geschlossen werden', type: 'error' });
        }
      } else {
        showToast({ message: 'Raum verlassen', type: 'success' });
      }
    })();
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
