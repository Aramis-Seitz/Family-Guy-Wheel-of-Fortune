import { addBtn, input, spinLeftBtn, spinRightBtn, multiplierSlider, bulkAddToWheelBtn, wheelEmptyHint } from "../shared/dom.js";
import {
  createRoomBtn, roomKeyInput, joinRoomBtn, leaveRoomBtn,
  roomKeyDisplay, roomInfo, playersList, copyRoomKeyBtn,
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { applyActiveAssets } from "../shared/asset-selection.js";
import { ensureDefaultAssets } from "../api/user-api.js";
import { initInventory } from "../inventory/inventory.js";
import { addName, initNameList, getNames, replaceNames, lockNameEditing, unlockNameEditing } from "../names/name-list.js";
import { nameState } from "../names/name-state.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import {
  initWheelControls, spinWheel,
  setSpinOverride, lockSpinButtons, unlockSpinButtons,
} from "../wheel/spin.js";
import { initMultiplierSlider, getMultiplier, setMultiplierSlider, updateMultiplierDisplay, disableMultiplierSlider, enableMultiplierSlider } from "../wheel/multiplier.js";
import { initVolumeSlider } from "../wheel/volume.js";
import { preloadStaticSounds } from "../wheel/sound.js";
import { initWinnerModal } from "../wheel/winner.js";
import { createRoom, joinRoom, spinRoom, closeRoom, subscribeToRoom, unsubscribeFromRoom, setMultiplier, updateRoomWheelItems } from "../room.js";
import { showToast } from "../shared/toast.js";
import type { Direction } from "../shared/types.js";
import { MIN_SPIN_ROTATIONS } from "../shared/constants.js";
import { initShop } from "../shop/shop.js";

let activeRoomKey: string | null = null;
let isHost = false;
let savedNames: string[] = [];
let removedInRoom = new Set<string>();
let roomWheelItems: string[] = [];
let nameStateUnsubscribe: (() => void) | null = null;
let multiplierSyncListener: (() => void) | null = null;


function initNameControls(): void {
  addBtn.addEventListener("click", async () => {
    if (activeRoomKey && isHost) {
      await addCustomWheelItem(input.value);
    } else {
      addName(input.value);
    }
  });

  input.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (activeRoomKey && isHost) {
        await addCustomWheelItem(input.value);
      } else {
        addName(input.value);
      }
    }
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
    li.className = 'player-item';

    const label = document.createElement('span');
    label.className = 'player-name';
    label.textContent = name;
    li.appendChild(label);

    if (isHost) {
      const controls = document.createElement('span');
      controls.className = 'player-controls';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'player-control-btn';
      addBtn.textContent = '+';
      addBtn.title = `Zu Rad hinzufügen: ${name}`;
      addBtn.addEventListener('click', async () => {
        await addPlayerToWheelItem(name);
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'player-control-btn';
      removeBtn.textContent = '−';
      removeBtn.title = `Vom Rad entfernen: ${name}`;
      removeBtn.addEventListener('click', async () => {
        await removePlayerFromWheelItem(name);
      });

      controls.appendChild(addBtn);
      controls.appendChild(removeBtn);
      li.appendChild(controls);
    }

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

function setHostControlsVisibility(host: boolean): void {
  if (bulkAddToWheelBtn) {
    bulkAddToWheelBtn.classList.toggle('hidden', !host);
  }

  const hostOnlyInputs = [input, addBtn];
  hostOnlyInputs.forEach((el) => {
    if (!el) return;
    el.disabled = !host;
    el.style.opacity = host ? '1' : '0.5';
    el.style.cursor = host ? 'text' : 'not-allowed';
  });
}

function updateWheelEmptyState(): void {
  if (!wheelEmptyHint) return;
  wheelEmptyHint.classList.toggle('hidden', roomWheelItems.length > 0);
}

// Called once when creating or joining a room — sets the wheel to exactly the room's player list.
function initRoomPlayers(players: string[]): void {
  replaceNames([]);
  renderPlayersSidebar(players);
  updateSpinButtonState(getNames().length);
}

function syncRoomPlayers(players: string[]): void {
  renderPlayersSidebar(players);
  updateSpinButtonState(getNames().length);
}

function setRoomActive(roomKey: string, host: boolean): void {
  activeRoomKey = roomKey;
  isHost = host;
  if (host) {
    lockNameEditing(false);
  } else {
    lockNameEditing(true);
  }
  setHostControlsVisibility(host);
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  if (!host) {
    spinLeftBtn.classList.add('room-guest');
    spinRightBtn.classList.add('room-guest');
  } else {
    spinLeftBtn.classList.remove('room-guest');
    spinRightBtn.classList.remove('room-guest');
  }
}

function clearRoom(): void {
  if (nameStateUnsubscribe) {
    nameStateUnsubscribe();
    nameStateUnsubscribe = null;
  }
  removedInRoom.clear();
  roomWheelItems = [];
  unlockNameEditing();
  unsubscribeFromRoom();
  setSpinOverride(null);
  activeRoomKey = null;
  isHost = false;
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  spinLeftBtn.classList.remove('room-guest', 'room-solo');
  spinRightBtn.classList.remove('room-guest', 'room-solo');
  if (multiplierSyncListener) {
    multiplierSlider?.removeEventListener('input', multiplierSyncListener);
    multiplierSyncListener = null;
  }
  enableMultiplierSlider();
  setHostControlsVisibility(false);
  renderPlayersSidebar([]);
  replaceNames(savedNames);
  updateWheelEmptyState();
}

// Non-host only: realtime fires → spin wheel visually (no coins, winner determined locally for display)
function handleRoomSpinEvent(lastSpin: number, multiplier: number): void {
  if (isHost) return; // host already spun directly from POST response
  lockSpinButtons();
  const names = getNames();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + lastSpin;
  spinWheel(totalSteps, 'right', '', names);
}

// Host only: POST → spin directly (token guaranteed, no race condition)
async function handleRoomSpinClick(direction: Direction): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  lockSpinButtons();
  try {
    const names = getNames();
    const { ranNum, spinToken } = await spinRoom(activeRoomKey, names);
    const totalSteps = Math.round(MIN_SPIN_ROTATIONS * getMultiplier()) + ranNum;
    spinWheel(totalSteps, direction, spinToken, names);
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

function setWheelItemsFromRoom(items: string[]): void {
  roomWheelItems = [...items];
  replaceNames(items);
  updateWheelEmptyState();
}

async function addCustomWheelItem(rawName: string): Promise<void> {
  const trimmed = rawName.trim();
  if (!trimmed) return;
  if (!activeRoomKey || !isHost) {
    addName(trimmed);
    return;
  }

  const updatedItems = [...(roomWheelItems ?? []), trimmed];
  await updateRoomWheelItems(activeRoomKey, updatedItems);
  input.value = '';
}

async function addPlayerToWheelItem(playerName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const updatedItems = [...(roomWheelItems ?? []), playerName];
  await updateRoomWheelItems(activeRoomKey, updatedItems);
}

async function removePlayerFromWheelItem(playerName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const items = roomWheelItems ?? [];
  const index = items.findIndex((item) => item === playerName);
  if (index < 0) return;
  const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
  await updateRoomWheelItems(activeRoomKey, updatedItems);
}

async function addAllPlayersToWheel(players: string[]): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const current = roomWheelItems ?? [];

  const currentCounts = current.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  const playersToAdd: string[] = [];
  const requestedCounts = players.reduce<Record<string, number>>((acc, name) => {
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  Object.entries(requestedCounts).forEach(([player, count]) => {
    const existingCount = currentCounts[player] ?? 0;
    const missing = Math.max(0, count - existingCount);
    for (let i = 0; i < missing; i += 1) {
      playersToAdd.push(player);
    }
  });

  if (playersToAdd.length === 0) return;
  const updatedItems = [...current, ...playersToAdd];
  await updateRoomWheelItems(activeRoomKey, updatedItems);
}

function initRoomControls(): void {
  bulkAddToWheelBtn?.addEventListener('click', async () => {
    if (!activeRoomKey || !isHost) return;
    const players = Array.from(playersList?.querySelectorAll('.player-name') ?? [])
      .map((node) => node.textContent?.trim() ?? '');
    await addAllPlayersToWheel(players);
  });

  createRoomBtn?.addEventListener('click', () => {
    void (async () => {
      try {
        savedNames = getNames();
        const { roomKey, players, wheelItems } = await createRoom();
        setRoomActive(roomKey, true);
        setSpinOverride(handleRoomSpinClick);
        initRoomPlayers(players);
        setWheelItemsFromRoom(wheelItems ?? []);
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers, onRoomClosed, (m) => {
          setMultiplierSlider(m);
          updateMultiplierDisplay();
        }, setWheelItemsFromRoom);
        multiplierSyncListener = () => {
          if (!activeRoomKey) return;
          void setMultiplier(activeRoomKey, getMultiplier());
        };
        multiplierSlider?.addEventListener('input', multiplierSyncListener);
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
        const { players, multiplier, wheelItems } = await joinRoom(roomKey);
        setRoomActive(roomKey, false);
        setSpinOverride(handleRoomSpinClick);
        initRoomPlayers(players);
        setWheelItemsFromRoom(wheelItems ?? []);
        setMultiplierSlider(multiplier);
        updateMultiplierDisplay();
        disableMultiplierSlider();
        subscribeToRoom(roomKey, handleRoomSpinEvent, syncRoomPlayers, onRoomClosed, (m) => {
          setMultiplierSlider(m);
          updateMultiplierDisplay();
        }, setWheelItemsFromRoom);
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

export function isMultiplayerActive(): boolean {
  return !!activeRoomKey;
}

async function initApp(): Promise<void> {
  if (!(await hasActiveSession())) {
    window.location.href = "/login.html";
    return;
  }

  initNameList();
  initNameControls();
  initMultiplierSlider();
  initVolumeSlider();
  void preloadStaticSounds();
  initWheelControls();
  initShareFeature();
  await initProfileUI();
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomControls();
  initWinnerModal();
}

void initApp();
