import { supabaseClient } from './shared/supabase-client.js';
import type { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { optionalElement } from "./shared/dom-helpers.js";
import {
  addNameToList, getNamesInWheelList, replaceNames,
  lockNameEditing, unlockNameEditing, setOnNameInWheelListRemoved,
  setMultiplayerMode, addBtn, input,
} from "./names/names-in-wheel-list.js";
import {
  spinWheel, setSpinOverride, setResetOverride, lockSpinButtons,
  unlockSpinButtons, resetWheelRotation, isSpinning,
  spinLeftBtn, spinRightBtn, resetBtn,
  MIN_SPIN_ROTATIONS, SPIN_DISABLED_OPACITY,
} from "./wheel/spin.js";
import type { Direction } from "./wheel/spin.js";
import {
  getMultiplier, setMultiplierSlider,
  updateMultiplierDisplay, disableMultiplierSlider, enableMultiplierSlider,
  multiplierSlider,
} from "./wheel/multiplier.js";
import { hideWinnerModal } from "./wheel/winner.js";
import { initChat, destroyChat } from "./multiplayer/chat.js";
import { showToast } from "./shared/toast.js";
import {
  createRoom,
  leaveRoom,
  joinRoom,
  spinRoom,
  leaveRoomOnUnload,
  resetRoom,
  updateRoomNames,
  setMultiplier
} from './api/room-api.js';

let myUsername = '';

export function setMyUsername(newUsername: string): void {
  myUsername = newUsername;
}

interface RoomPlayer {
  id: string;
  username: string;
}

interface RoomRow {
  last_spin: number;
  spun_at: string;
  players: RoomPlayer[];
  names_in_wheel?: string[];
  multiplier: number;
  spin_direction: string | null;
}

let activeChannel: RealtimeChannel | null = null;
let lastKnownPlayersJson = '';
let lastKnownNamesJson = '';
let lastKnownMultiplier: number | null = null;

export function subscribeToRoom(
  roomKey: string,
  onSpin: (lastSpin: number, multiplier: number, direction: string) => void,
  onPlayersUpdate?: (players: string[]) => void,
  onClose?: () => void,
  onMultiplierUpdate?: (multiplier: number) => void,
  onNamesUpdate?: (names: string[]) => void,
  onReset?: () => void,
): void {
  unsubscribeFromRoom();

  activeChannel = supabaseClient
    .channel(`room:${roomKey}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `room_key=eq.${roomKey}`,
      },
      (payload: { new: RoomRow }) => {
        const row = payload.new;

        if (Array.isArray(row.players)) {
          // players = [] signals the host closed the room
          if (row.players.length === 0) {
            onClose?.();
            return;
          }

          // Only call onPlayersUpdate when the player list actually changed (not on spin events)
          const json = JSON.stringify(row.players);
          if (json !== lastKnownPlayersJson) {
            lastKnownPlayersJson = json;
            onPlayersUpdate?.(row.players.map((p) => p.username));
          }
        }

        if (Array.isArray(row.names_in_wheel)) {
          const wheelJson = JSON.stringify(row.names_in_wheel);
          if (wheelJson !== lastKnownNamesJson) {
            lastKnownNamesJson = wheelJson;
            onNamesUpdate?.(row.names_in_wheel);
          }
        }

        // Notify when the host changes the multiplier
        const newMultiplier = row.multiplier ?? 1;
        if (newMultiplier !== lastKnownMultiplier) {
          lastKnownMultiplier = newMultiplier;
          onMultiplierUpdate?.(newMultiplier);
        }

        if (!row.spun_at) return;
        const ageMs = Date.now() - new Date(row.spun_at).getTime();
        if (ageMs > 5000) return;

        if (row.last_spin === -1) {
          onReset?.();
          return;
        }

        onSpin(row.last_spin, newMultiplier, row.spin_direction ?? 'right');

      },
    )
    .subscribe();
}

export function unsubscribeFromRoom(): void {
  if (activeChannel) {
    void supabaseClient.removeChannel(activeChannel);
    activeChannel = null;
  }
  lastKnownPlayersJson = '';
  lastKnownNamesJson = '';
  lastKnownMultiplier = null;
}

export function initRoomUnloadGuard(getActiveRoomKey: () => string | null): void {
  let cachedToken = '';

  void supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
    cachedToken = session?.access_token ?? '';
  });

  supabaseClient.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    cachedToken = session?.access_token ?? '';
  });

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    const roomKey = getActiveRoomKey();
    if (!roomKey || !cachedToken) return;
    leaveRoomOnUnload(roomKey, cachedToken);
  });
}


export function handleLocalReset(): void {
  resetWheelRotation();
  hideWinnerModal();
}

export let activeRoomKey: string | null = null;
let isHost = false;

export function initNameControls(): void {
  addBtn.addEventListener("click", async () => {
    if (activeRoomKey && isHost) {
      await addCustomNameToWheel(input.value);
    } else {
      addNameToList(input.value);
    }
  });

  input.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (activeRoomKey && isHost) {
        await addCustomNameToWheel(input.value);
      } else {
        addNameToList(input.value);
      }
    }
  });
}


let roomNames: string[] = [];
let activeRoomHostName = '';
const playersList = optionalElement<HTMLUListElement>("room-players-list");

function renderPlayersSidebar(players: string[]): void {
  if (!playersList) return;
  const list = playersList;
  list.innerHTML = '';

  players.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'room__player-item';

    const label = document.createElement('span');
    label.className = 'room__player-name';
    label.textContent = name;
    li.appendChild(label);

    if (name === activeRoomHostName) {
      const tag = document.createElement('span');
      tag.textContent = 'Host';
      tag.className = 'room__host-tag';
      li.appendChild(tag);
    }

    if (isHost) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'room__player-toggle-btn';
      const inWheel = (roomNames ?? []).includes(name);
      toggle.textContent = inWheel ? '−' : '+';
      if (inWheel) toggle.classList.add('room__player-toggle-btn--added');
      toggle.title = inWheel ? `Vom Rad entfernen: ${name}` : `Zu Rad hinzufügen: ${name}`;

      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          if ((roomNames ?? []).includes(name)) {
            await removePlayerNameFromWheel(name);
          } else {
            await addPlayerNameToWheel(name);
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

function syncMultiplayerSpinButtonState(): void {
  if (!activeRoomKey) return;

  const hasEnoughItems = getNamesInWheelList().length >= 2;
  const disabled = !hasEnoughItems || !isHost;

  [spinLeftBtn, spinRightBtn].forEach((btn) => {
    btn.disabled = disabled;
    btn.classList.toggle('spin__btn--room-solo', !hasEnoughItems);
    btn.classList.toggle('spin__btn--room-guest', !isHost);

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

export const bulkAddToWheelBtn = optionalElement<HTMLButtonElement>("room-bulk-add-btn");

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

export const wheelEmptyHint = optionalElement<HTMLDivElement>("wheel-empty-hint");

function updateWheelEmptyState(): void {
  if (!wheelEmptyHint) return;
  wheelEmptyHint.classList.toggle('hidden', getNamesInWheelList().length > 0);
}

// Called once when creating or joining a room — sidebar gets the full player
// list, the wheel itself starts empty until setNamesFromRoom() applies
// the room's persisted wheel-item selection.
let currentPlayers: string[] = [];

export function initRoomPlayers(players: string[]): void {
  currentPlayers = [...players];
  replaceNames([]);
  renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();
}

// Called on Realtime player-list updates.
function syncRoomPlayers(players: string[]): void {
  if (!activeRoomKey) return;
  currentPlayers = [...players];
  renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();

}

const roomKeyDisplay = optionalElement<HTMLSpanElement>("room-key-display");
const roomInfo = optionalElement<HTMLDivElement>("room-info");

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
    spinLeftBtn.classList.add('spin__btn--room-guest');
    spinRightBtn.classList.add('spin__btn--room-guest');
    resetBtn.disabled = true;
    resetBtn.style.setProperty('opacity', '0.4');
    resetBtn.style.setProperty('cursor', 'not-allowed');
  } else {
    spinLeftBtn.classList.remove('spin__btn--room-guest');
    spinRightBtn.classList.remove('spin__btn--room-guest');
    setResetOverride(() => { void handleRoomResetClick(); });
  }

  syncMultiplayerSpinButtonState();
}

let savedNames: string[] = [];
let nameStateUnsubscribe: (() => void) | null = null;
let multiplierSyncListener: (() => void) | null = null;

function clearRoom(): void {
  if (nameStateUnsubscribe) {
    nameStateUnsubscribe();
    nameStateUnsubscribe = null;
  }
  currentPlayers = [];
  roomNames = [];
  setMultiplayerMode(false);
  setOnNameInWheelListRemoved(null);
  unlockNameEditing();
  unsubscribeFromRoom();
  setSpinOverride(null);
  activeRoomKey = null;
  isHost = false;
  activeRoomHostName = '';
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  spinLeftBtn.classList.remove('spin__btn--room-guest', 'spin__btn--room-solo');
  spinRightBtn.classList.remove('spin__btn--room-guest', 'spin__btn--room-solo');
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
  const names = getNamesInWheelList();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + lastSpin;
  spinWheel(totalSteps, direction as Direction, '', names);
}

// Host only: POST → spin directly (token guaranteed, no race condition)
async function handleRoomSpinClick(direction: Direction): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  lockSpinButtons();
  try {
    const names = getNamesInWheelList();
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

function setNamesFromRoom(names: string[]): void {
  roomNames = [...names];
  replaceNames(names);
  updateWheelEmptyState();
  // refresh player sidebar buttons so their toggle state updates
  if (currentPlayers.length > 0) renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  syncMultiplayerSpinButtonState();
}

async function addCustomNameToWheel(customName: string): Promise<void> {
  const trimmed = customName.trim();
  if (!trimmed) return;
  if (!activeRoomKey || !isHost) {
    addNameToList(trimmed);
    input.value = '';
    return;
  }

  const updatedItems = [...(roomNames ?? []), trimmed];
  await updateRoomNames(activeRoomKey, updatedItems);
  input.value = '';
}

async function addPlayerNameToWheel(playerName: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const updatedItems = [...(roomNames ?? []), playerName];
  await updateRoomNames(activeRoomKey, updatedItems);
}

async function removeNameFromWheel(name: string): Promise<void> {
  if (!activeRoomKey || !isHost) return;
  const items = roomNames ?? [];
  const index = items.findIndex((item) => item === name);
  if (index < 0) return;
  const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
  await updateRoomNames(activeRoomKey, updatedItems);
}

async function removePlayerNameFromWheel(playerName: string): Promise<void> {
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
    bulkAddToWheelBtn.classList.remove('room__btn--remove');
  } else {
    bulkAddToWheelBtn.textContent = 'Alle vom Rad entfernen';
    bulkAddToWheelBtn.classList.add('room__btn--remove');
  }
}

async function executeLeaveRoom(): Promise<void> {
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
}

async function executeCreateRoom(): Promise<void> {
  try {
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
      handleRoomResetEvent
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
}

async function executeJoinRoom(roomKey: string): Promise<void> {
  try {
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
      handleRoomResetEvent
    );
    initChat(roomKey, myUsername);
    showToast({ message: `Raum beigetreten: ${roomKey}`, type: 'success' });
  } catch (error) {
    console.error('[ROOM] Beitreten fehlgeschlagen:', error);
    showToast({ message: 'Raum nicht gefunden oder Fehler beim Beitreten', type: 'error' });
  }
}

let pendingRoomAction: (() => Promise<void>) | null = null;
const leaveRoomConfirmModal = optionalElement<HTMLDialogElement>("leave-room-confirm-modal");
const leaveRoomConfirmMessage = optionalElement<HTMLParagraphElement>("leave-room-confirm-message");

function showSwitchRoomConfirm(message: string, action: () => Promise<void>): void {
  if (leaveRoomConfirmMessage) leaveRoomConfirmMessage.textContent = message;
  pendingRoomAction = action;
  leaveRoomConfirmModal?.showModal();
}

const createRoomBtn = optionalElement<HTMLButtonElement>("room-create-btn");
const roomKeyInput = optionalElement<HTMLInputElement>("room-key-input");
const joinRoomBtn = optionalElement<HTMLButtonElement>("room-join-btn");
const leaveRoomBtn = optionalElement<HTMLButtonElement>("room-leave-btn");
const copyRoomKeyBtn = optionalElement<HTMLButtonElement>("room-copy-key-btn");
const confirmLeaveRoomBtn = optionalElement<HTMLButtonElement>("leave-room-confirm-confirm-btn");
const cancelLeaveRoomBtn = optionalElement<HTMLButtonElement>("leave-room-confirm-cancel-btn");

export function initRoomControls(): void {
  setOnNameInWheelListRemoved(async (removedName: string): Promise<void> => {
    await removeNameFromWheel(removedName);
  });

  bulkAddToWheelBtn?.addEventListener('click', async () => {
    if (!activeRoomKey || !isHost) return;
    const players = Array.from(playersList?.querySelectorAll('.room__player-name') ?? [])
      .map((node) => node.textContent?.trim() ?? '');
    await addAllPlayersToWheel(players);
  });

  createRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
      return;
    }
    if (!activeRoomKey) savedNames = getNamesInWheelList();
    if (activeRoomKey) {
      showSwitchRoomConfirm(
        `Du bist noch in Raum ${activeRoomKey}. Raum verlassen und neuen Raum erstellen?`,
        executeCreateRoom,
      );
      return;
    }
    void executeCreateRoom();
  });

  joinRoomBtn?.addEventListener('click', () => {
    const roomKey = roomKeyInput?.value.trim().toUpperCase() ?? '';
    if (!roomKey) return;
    if (isSpinning()) {
      showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
      return;
    }
    if (!activeRoomKey) savedNames = getNamesInWheelList();
    if (activeRoomKey) {
      showSwitchRoomConfirm(
        `Du bist noch in Raum ${activeRoomKey}. Raum verlassen und Raum ${roomKey} beitreten?`,
        () => executeJoinRoom(roomKey),
      );
      return;
    }
    void executeJoinRoom(roomKey);
  });

  leaveRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
      return;
    }
    if (leaveRoomConfirmMessage) {
      if (isHost && currentPlayers.length > 1) {
        const guestCount = currentPlayers.length - 1;
        leaveRoomConfirmMessage.textContent =
          `Du bist Host von ${guestCount} ${guestCount === 1 ? 'Mitspieler' : 'Mitspielern'}. Raum wirklich schließen?`;
      } else {
        leaveRoomConfirmMessage.textContent = isHost ? 'Raum wirklich schließen?' : 'Raum wirklich verlassen?';
      }
    }
    leaveRoomConfirmModal?.showModal();
  });

  confirmLeaveRoomBtn?.addEventListener('click', () => {
    leaveRoomConfirmModal?.close();
    if (pendingRoomAction) {
      const action = pendingRoomAction;
      pendingRoomAction = null;
      void action();
    } else {
      void executeLeaveRoom();
    }
  });

  cancelLeaveRoomBtn?.addEventListener('click', () => {
    leaveRoomConfirmModal?.close();
    pendingRoomAction = null;
  });

  copyRoomKeyBtn?.addEventListener('click', () => {
    const btn = copyRoomKeyBtn;
    if (!btn) return;
    const key = roomKeyDisplay?.textContent ?? '';
    if (!key) return;
    void navigator.clipboard.writeText(key).then(() => {
      btn.classList.add('room__btn--copied');
      btn.textContent = '✓';
      setTimeout(() => {
        btn.classList.remove('room__btn--copied');
        btn.innerHTML = '&#128203;';
      }, 1500);
      showToast({ message: 'Code in die Zwischenablage kopiert', type: 'success' });
    });
  });
}

export function isMultiplayerActive(): boolean {
  return !!activeRoomKey;
}

async function hasActiveSession(): Promise<boolean> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return Boolean(session);
}

export async function redirectIfNoSession(): Promise<boolean> {
  if (await hasActiveSession()) return false;
  window.location.href = "/login.html";
  return true;
}