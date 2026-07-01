import {
  addBtn, input, spinLeftBtn, spinRightBtn, multiplierSlider,
  bulkAddToWheelBtn, wheelEmptyHint, resetBtn, profileName,
} from "../shared/dom.js";
import {
  createRoomBtn, roomKeyInput, joinRoomBtn, leaveRoomBtn,
  roomKeyDisplay, roomInfo, playersList, copyRoomKeyBtn,
} from "../shared/dom.js";
import { supabaseClient } from "../shared/supabase-client.js";
import { applyActiveAssets } from "../shared/asset-selection.js";
import { ensureDefaultAssets } from "../api/user-api.js";
import { initInventory } from "../inventory/inventory.js";
import {
  addName, initNameList, getNames, replaceNames,
  lockNameEditing, unlockNameEditing, setOnNameRemoved,
  setMultiplayerMode,
} from "../names/name-list.js";
import { initShareFeature } from "../names/share-name-list.js";
import { initProfileUI } from "../profile/profiles.js";
import {
  initWheelControls, spinWheel,
  setSpinOverride, setResetOverride, lockSpinButtons, unlockSpinButtons,
  resetWheelRotation, isSpinning,
} from "../wheel/spin.js";
import {
  initMultiplierSlider, getMultiplier, setMultiplierSlider,
  updateMultiplierDisplay, disableMultiplierSlider, enableMultiplierSlider,
} from "../wheel/multiplier.js";
import { initVolumeSlider } from "../wheel/volume.js";
import { preloadStaticSounds } from "../wheel/sound.js";
import { initWinnerModal, hideWinnerModal } from "../wheel/winner.js";
import {
  createRoom, joinRoom, leaveRoom, spinRoom, resetRoom,
  subscribeToRoom, unsubscribeFromRoom, setMultiplier, updateRoomNames,
} from "../room.js";
import { initChat, destroyChat } from "../multiplayer/chat.js";
import { showToast } from "../shared/toast.js";
import { MIN_SPIN_ROTATIONS, SPIN_DISABLED_OPACITY } from "../shared/constants.js";
import type { Direction } from "../shared/types.js";
import { initShop } from "../shop/shop.js";

let activeRoomKey: string | null = null;
let isHost = false;
let activeRoomHostName = '';
let myUsername = '';
let savedNames: string[] = [];
let roomNames: string[] = [];
let currentPlayers: string[] = [];
let multiplierSyncListener: (() => void) | null = null;

function handleLocalReset(): void {
  resetWheelRotation();
  hideWinnerModal();
}

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

    if (name === activeRoomHostName) {
      const tag = document.createElement('span');
      tag.textContent = 'Host';
      tag.className = 'host-tag';
      li.appendChild(tag);
    }

    if (isHost) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'player-toggle-btn';
      const inWheel = (roomNames ?? []).includes(name);
      toggle.textContent = inWheel ? '−' : '+';
      if (inWheel) toggle.classList.add('added');
      toggle.title = inWheel ? `Vom Rad entfernen: ${name}` : `Zu Rad hinzufügen: ${name}`;

      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          if ((roomNames ?? []).includes(name)) {
            await removePlayerFromWheelItem(name);
          } else {
            await addPlayerToWheelItem(name);
          }
        } catch (err) {
          console.error('[ROOM] toggle player failed', err);
        } finally {
          toggle.disabled = false;
        }
      });

      li.appendChild(toggle);
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

function syncMultiplayerSpinButtonState(): void {
  if (!activeRoomKey) return;

  const hasEnoughItems = getNames().length >= 2;
  const disabled = !hasEnoughItems || !isHost;

  [spinLeftBtn, spinRightBtn].forEach((btn) => {
    btn.disabled = disabled;
    btn.classList.toggle('room-solo', !hasEnoughItems);
    btn.classList.toggle('room-guest', !isHost);

    if (disabled) {
      btn.style.setProperty('opacity', SPIN_DISABLED_OPACITY);
      btn.style.setProperty('cursor', 'not-allowed');
      btn.style.setProperty('pointer-events', 'none');
    } else {
      btn.style.removeProperty('opacity');
      btn.style.removeProperty('cursor');
      btn.style.removeProperty('pointer-events');
    }
  });
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
  wheelEmptyHint.classList.toggle('hidden', getNames().length > 0);
}

// Called once when creating or joining a room — sidebar gets the full player
// list, the wheel itself starts empty until setNamesFromRoom() applies
// the room's persisted wheel-item selection.
function initRoomPlayers(players: string[]): void {
  currentPlayers = [...players];
  replaceNames([]);
  renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();
}

// Called on Realtime player-list updates.
function syncRoomPlayers(players: string[]): void {
  currentPlayers = [...players];
  renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();
}

function setRoomActive(roomKey: string, host: boolean): void {
  activeRoomKey = roomKey;
  isHost = host;
  setMultiplayerMode(true);
  if (host) {
    lockNameEditing(false, false);
  } else {
    lockNameEditing(true, true);
  }
  setHostControlsVisibility(host);
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  if (!host) {
    spinLeftBtn.classList.add('room-guest');
    spinRightBtn.classList.add('room-guest');
    resetBtn.disabled = true;
    resetBtn.style.setProperty('opacity', '0.4');
    resetBtn.style.setProperty('cursor', 'not-allowed');
  } else {
    spinLeftBtn.classList.remove('room-guest');
    spinRightBtn.classList.remove('room-guest');
    setResetOverride(() => { void handleRoomResetClick(); });
  }

  syncMultiplayerSpinButtonState();
}

function clearRoom(): void {
  roomNames = [];
  setMultiplayerMode(false);
  setOnNameRemoved(null);
  unlockNameEditing();
  unsubscribeFromRoom();
  setSpinOverride(null);
  activeRoomKey = null;
  isHost = false;
  activeRoomHostName = '';
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  spinLeftBtn.classList.remove('room-guest', 'room-solo');
  spinRightBtn.classList.remove('room-guest', 'room-solo');
  resetBtn.disabled = false;
  resetBtn.style.removeProperty('opacity');
  resetBtn.style.removeProperty('cursor');
  setResetOverride(handleLocalReset);
  if (multiplierSyncListener) {
    multiplierSlider?.removeEventListener('input', multiplierSyncListener);
    multiplierSyncListener = null;
  }
  enableMultiplierSlider();
  setHostControlsVisibility(false);
  renderPlayersSidebar([]);
  replaceNames(savedNames);
  updateWheelEmptyState();
  destroyChat();
}

// Non-host only: realtime fires → spin wheel visually (no coins, winner determined locally for display)
function handleRoomSpinEvent(lastSpin: number, multiplier: number, direction: string): void {
  if (isHost) return; // host already spun directly from POST response
  lockSpinButtons();
  const names = getNames();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + lastSpin;
  spinWheel(totalSteps, direction as Direction, '', names);
}

// Host only: POST → spin directly (token guaranteed, no race condition)
async function handleRoomSpinClick(direction: Direction): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  lockSpinButtons();
  try {
    const names = getNames();
    const { ranNum, spinToken } = await spinRoom(activeRoomKey, names, direction);
    const totalSteps = Math.round(MIN_SPIN_ROTATIONS * getMultiplier()) + ranNum;
    spinWheel(totalSteps, direction, spinToken, names);
  } catch (error) {
    console.error('[ROOM] Spin fehlgeschlagen:', error);
    unlockSpinButtons();
    showToast({ message: 'Spin fehlgeschlagen', type: 'error' });
  }
}

async function handleRoomResetClick(): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  try {
    await resetRoom(activeRoomKey);
    handleLocalReset();
  } catch (error) {
    console.error('[ROOM] Reset fehlgeschlagen:', error);
    showToast({ message: 'Reset fehlgeschlagen', type: 'error' });
  }
}

function handleRoomResetEvent(): void {
  if (isHost) return; // host already reset locally after POST
  handleLocalReset();
}

function onRoomClosed(): void {
  if (isHost) return; // host handles its own leave flow
  clearRoom();
  showToast({ message: 'Der Host hat den Raum geschlossen', type: 'info' });
}

function setNamesFromRoom(items: string[]): void {
  roomNames = [...items];
  replaceNames(items);
  updateWheelEmptyState();
  // refresh player sidebar buttons so their toggle state updates
  if (currentPlayers.length > 0) renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();
}

async function addCustomWheelItem(rawName: string): Promise<void> {
  const trimmed = rawName.trim();
  if (!trimmed) return;
  if (!activeRoomKey || !isHost) {
    addName(trimmed);
    input.value = '';
    return;
  }

  const updatedItems = [...(roomNames ?? []), trimmed];
  await updateRoomNames(activeRoomKey, updatedItems);
  input.value = '';
}

async function addPlayerToWheelItem(playerName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const updatedItems = [...(roomNames ?? []), playerName];
  await updateRoomNames(activeRoomKey, updatedItems);
}

async function removeNameFromWheelItem(itemName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const items = roomNames ?? [];
  const index = items.findIndex((item) => item === itemName);
  if (index < 0) return;
  const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
  await updateRoomNames(activeRoomKey, updatedItems);
}

async function removePlayerFromWheelItem(playerName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const items = roomNames ?? [];
  const index = items.findIndex((item) => item === playerName);
  if (index < 0) return;
  const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
  await updateRoomNames(activeRoomKey, updatedItems);
}

async function addAllPlayersToWheel(players: string[]): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const current = roomNames ?? [];
  const missingPlayers = players.filter((player) => !current.includes(player));

  if (missingPlayers.length > 0) {
    const updatedItems = [...current, ...missingPlayers];
    await updateRoomNames(activeRoomKey, updatedItems);
    return;
  }

  const updatedItems = current.filter((item) => !players.includes(item));
  await updateRoomNames(activeRoomKey, updatedItems);
}

function updateBulkButtonState(players: string[]): void {
  if (!bulkAddToWheelBtn) return;
  const anyMissing = players.some((p) => !(roomNames ?? []).includes(p));
  if (anyMissing) {
    bulkAddToWheelBtn.textContent = 'Alle zum Rad hinzufügen';
    bulkAddToWheelBtn.classList.remove('bulk-remove');
  } else {
    bulkAddToWheelBtn.textContent = 'Alle vom Rad entfernen';
    bulkAddToWheelBtn.classList.add('bulk-remove');
  }
}

function initRoomControls(): void {
  setOnNameRemoved(async (removedName: string): Promise<void> => {
    await removeNameFromWheelItem(removedName);
  });

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
        const { roomKey, players, names } = await createRoom();
        activeRoomHostName = players[0] ?? '';
        setRoomActive(roomKey, true);
        setSpinOverride(handleRoomSpinClick);
        initRoomPlayers(players);
        setNamesFromRoom(names ?? []);
        subscribeToRoom(
          roomKey,
          handleRoomSpinEvent,
          syncRoomPlayers,
          onRoomClosed,
          (m) => { setMultiplierSlider(m); updateMultiplierDisplay(); },
          setNamesFromRoom,
          handleRoomResetEvent,
        );
        initChat(roomKey, myUsername);
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
        const { players, multiplier, names, hostName } = await joinRoom(roomKey);
        activeRoomHostName = hostName;
        setRoomActive(roomKey, false);
        setSpinOverride(handleRoomSpinClick);
        initRoomPlayers(players);
        setNamesFromRoom(names ?? []);
        setMultiplierSlider(multiplier);
        updateMultiplierDisplay();
        disableMultiplierSlider();
        subscribeToRoom(
          roomKey,
          handleRoomSpinEvent,
          syncRoomPlayers,
          onRoomClosed,
          (m) => { setMultiplierSlider(m); updateMultiplierDisplay(); },
          setNamesFromRoom,
          handleRoomResetEvent,
        );
        initChat(roomKey, myUsername);
        showToast({ message: `Raum beigetreten: ${roomKey}`, type: 'success' });
      } catch (error) {
        console.error('[ROOM] Beitreten fehlgeschlagen:', error);
        showToast({ message: 'Raum nicht gefunden oder Fehler beim Beitreten', type: 'error' });
      }
    })();
  });

  leaveRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
      return;
    }
    void (async () => {
      const wasHost = isHost;
      const roomKey = activeRoomKey;
      clearRoom(); // unsubscribe first so we don't receive our own close event
      if (roomKey) {
        try {
          await leaveRoom(roomKey);
          showToast({ message: wasHost ? 'Raum geschlossen' : 'Raum verlassen', type: 'success' });
        } catch {
          showToast({ message: wasHost ? 'Raum konnte nicht geschlossen werden' : 'Raum konnte nicht verlassen werden', type: 'error' });
        }
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
  setResetOverride(handleLocalReset);
  initShareFeature();
  await initProfileUI();
  myUsername = profileName?.textContent?.trim() || 'Anonym';
  await ensureDefaultAssets();
  await applyActiveAssets();
  initInventory();
  initShop();
  initRoomControls();
  initWinnerModal();
}

void initApp();