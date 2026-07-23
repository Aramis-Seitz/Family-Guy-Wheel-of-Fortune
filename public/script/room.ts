import { supabaseClient } from './shared/supabase-client';
import type { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { optionalElement } from "./shared/dom-helpers";
import {
  addNameToList, getNamesInWheelList, replaceNames,
  lockNameEditing, unlockNameEditing, setOnNameInWheelListRemoved,
  addBtn, input, getRemoveBtn,
} from "./names/names-in-wheel-list";
import {
  spinWheel, spinWheelWithRandomSteps, lockAllSpinElements, applyGameModeLock,
  resetWheelRotation, isSpinning,
  spinLeftBtn, spinRightBtn, resetBtn,
  MIN_SPIN_ROTATIONS,
} from "./wheel/spin";
import type { Direction, SpinElement } from "./wheel/spin";
import {
  getMultiplier, setMultiplierSlider,
  updateMultiplierDisplay,
  multiplierSlider,
} from "./wheel/multiplier";
import { hideWinnerModal } from "./wheel/winner";
import { initChat, destroyChat } from "./multiplayer/chat";
import { showToast } from "./shared/toast";
import { t } from "./app/i18n";
import {
  createRoom,
  leaveRoom,
  joinRoom,
  spinRoom,
  leaveRoomOnUnload,
  resetRoom,
  updateRoomNames,
  setMultiplier
} from './api/room-api';

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
  wheel_reset_at?: string | null;
  winner_modal_close_at?: string | null;
}

let activeChannel: RealtimeChannel | null = null;
let lastKnownPlayersJson = '';
let lastKnownNamesJson = '';
let lastKnownMultiplier: number | null = null;
let lastKnownWheelResetAt = '';
let lastKnownWinnerModalCloseAt = '';

export function subscribeToRoom(
  roomKey: string,
  onSpin: (lastSpin: number, multiplier: number, direction: string) => void,
  onPlayersUpdate?: (players: string[]) => void,
  onClose?: () => void,
  onMultiplierUpdate?: (multiplier: number) => void,
  onNamesUpdate?: (names: string[]) => void,
  onWheelReset?: () => void,
  onWinnerModalClose?: () => void,
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

        // Jede Spalte trägt genau ein Ereignis und wird unabhängig von den anderen ausgewertet.
        // Ein Reset-Write fasst last_spin/spun_at nie an — ein solches Update darf also nie
        // als Spin interpretiert werden, sonst spielen Gäste die Rad-Animation erneut ab.
        let resetHappened = false;

        if (row.wheel_reset_at && row.wheel_reset_at !== lastKnownWheelResetAt) {
          lastKnownWheelResetAt = row.wheel_reset_at;
          onWheelReset?.();
          resetHappened = true;
        }

        if (row.winner_modal_close_at && row.winner_modal_close_at !== lastKnownWinnerModalCloseAt) {
          lastKnownWinnerModalCloseAt = row.winner_modal_close_at;
          onWinnerModalClose?.();
          resetHappened = true;
        }

        if (resetHappened) return;

        if (!row.spun_at) return;
        const ageMs = Date.now() - new Date(row.spun_at).getTime();
        if (ageMs > 5000) return;

        onSpin(row.last_spin, newMultiplier, row.spin_direction ?? 'right');

      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'rooms',
        filter: `room_key=eq.${roomKey}`,
      },
      // Host-Leave löscht die Zeile direkt nach dem players=[]-Update; das DELETE
      // ist das verlässliche, endgültige Signal und braucht kein Racing gegen das UPDATE.
      () => { onClose?.(); },
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
  lastKnownWheelResetAt = '';
  lastKnownWinnerModalCloseAt = '';
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


export let activeRoomKey: string | null = null;

interface GameModeStrategy {
  onSpinClick(direction: Direction): Promise<void>;
  onReset(): void;
  onWinnerModalClose(): void;
  getRoleLockedElements(): SpinElement[];
  addCustomNameToWheel(rawName: string): Promise<void>;
  addPlayerNameToWheel(playerName: string): Promise<void>;
  removeNameFromWheel(name: string): Promise<void>;
  removePlayerNameFromWheel(playerName: string): Promise<void>;
  addAllPlayersToWheel(players: string[]): Promise<void>;
  canManagePlayers(): boolean;
  getLeaveConfirmMessage(guestCount: number): string;
  getLeaveResultMessage(success: boolean): string;
}

class SoloModeStrategy implements GameModeStrategy {
  async onSpinClick(direction: Direction): Promise<void> {
    await spinWheelWithRandomSteps(direction);
  }

  onReset(): void {
    resetWheelRotation();
  }

  onWinnerModalClose(): void {
    hideWinnerModal();
    resetWheelRotation();
  }

  getRoleLockedElements(): SpinElement[] {
    return [];
  }

  async addCustomNameToWheel(rawName: string): Promise<void> {
    addNameToList(rawName);
  }

  async addPlayerNameToWheel(): Promise<void> {
    // no-op — es gibt keine Mitspielerliste ohne Raum
  }

  async removeNameFromWheel(): Promise<void> {
    // no-op — lokales Entfernen läuft direkt über die Namensliste, nicht über den Raum-Callback
  }

  async removePlayerNameFromWheel(): Promise<void> {
    // no-op — es gibt keine Mitspielerliste ohne Raum
  }

  async addAllPlayersToWheel(): Promise<void> {
    // no-op — es gibt keine Mitspielerliste ohne Raum
  }

  canManagePlayers(): boolean {
    return false;
  }

  // Unerreichbar in der Praxis — #room-info (enthält den Leave-Button) ist
  // versteckt, solange currentMode SoloModeStrategy ist. Nur wegen des
  // GameModeStrategy-Interfaces Pflicht, siehe GuestModeStrategy.addName().
  getLeaveConfirmMessage(): string {
    return t("room.leaveConfirmGuest");
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? t("room.left") : t("api.room.leaveFailed");
  }
}

class HostModeStrategy implements GameModeStrategy {
  async onSpinClick(direction: Direction): Promise<void> {
    if (!activeRoomKey) return; // nur für TS-Typsicherheit — currentMode ist hier immer HostModeStrategy
    lockAllSpinElements();
    try {
      const names = getNamesInWheelList();
      const { ranNum, spinToken } = await spinRoom(activeRoomKey, names, direction);
      const totalSteps = Math.round(MIN_SPIN_ROTATIONS * getMultiplier()) + ranNum;
      spinWheel(totalSteps, direction, spinToken, names);
    } catch (error) {
      console.error('[ROOM] Spin fehlgeschlagen:', error);
      applyGameModeLock();
      showToast({ message: t("api.room.spinFailed"), type: 'error' });
    }
  }

  onReset(): void {
    void handleRoomReset(false);
  }

  onWinnerModalClose(): void {
    void handleRoomReset(true);
  }

  getRoleLockedElements(): SpinElement[] {
    return [];
  }

  async addCustomNameToWheel(rawName: string): Promise<void> {
    const trimmed = rawName.trim();
    if (!trimmed || !activeRoomKey) return;
    const updatedItems = [...(roomNames ?? []), trimmed];
    await updateRoomNames(activeRoomKey, updatedItems);
    input.value = '';
  }

  async addPlayerNameToWheel(playerName: string): Promise<void> {
    if (!activeRoomKey) return;
    const updatedItems = [...(roomNames ?? []), playerName];
    await updateRoomNames(activeRoomKey, updatedItems);
  }

  async removeNameFromWheel(name: string): Promise<void> {
    if (!activeRoomKey) return;
    const items = roomNames ?? [];
    const index = items.findIndex((item) => item === name);
    if (index < 0) return;
    const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
    await updateRoomNames(activeRoomKey, updatedItems);
  }

  async removePlayerNameFromWheel(playerName: string): Promise<void> {
    if (!activeRoomKey) return;
    const items = roomNames ?? [];
    const index = items.findIndex((item) => item === playerName);
    if (index < 0) return;
    const updatedItems = [...items.slice(0, index), ...items.slice(index + 1)];
    await updateRoomNames(activeRoomKey, updatedItems);
  }

  async addAllPlayersToWheel(players: string[]): Promise<void> {
    if (!activeRoomKey) return;
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

  canManagePlayers(): boolean {
    return true;
  }

  getLeaveConfirmMessage(guestCount: number): string {
    if (guestCount > 0) {
      return t("room.leaveConfirmGuests", { count: guestCount });
    }
    return t("room.leaveConfirmHost");
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? t("room.closed") : t("api.room.closeFailed");
  }
}

// Gast kann weder spinnen noch resetten noch die Namensliste verwalten — all das
// läuft ausschließlich über den Host und erreicht den Gast als Realtime-Event
// (handleRoomSpinEvent, handleWheelResetEvent, setNamesFromRoom).
class GuestModeStrategy implements GameModeStrategy {
  async onSpinClick(): Promise<void> {
    // no-op — Spin-Buttons sind für Gäste ohnehin dauerhaft gesperrt
  }

  onReset(): void {
    // no-op — Gast wartet auf das Realtime-Event vom Host
  }

  onWinnerModalClose(): void {
    // no-op — Gast wartet auf das Realtime-Event vom Host
  }

  getRoleLockedElements(): SpinElement[] {
    return [multiplierSlider, resetBtn, spinLeftBtn, spinRightBtn, input, addBtn, getRemoveBtn()];
  }

  async addCustomNameToWheel(rawName: string): Promise<void> {
    // unerreichbar in der Praxis (Eingabefeld ist für Gäste gesperrt) —
    // Fallback identisch zu Solo, falls der Guard doch mal umgangen wird
    addNameToList(rawName);
  }

  async addPlayerNameToWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Mitspielerliste
  }

  async removeNameFromWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Namensliste
  }

  async removePlayerNameFromWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Mitspielerliste
  }

  async addAllPlayersToWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Mitspielerliste
  }

  canManagePlayers(): boolean {
    return false;
  }

  getLeaveConfirmMessage(): string {
    return t("room.leaveConfirmGuest");
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? t("room.left") : t("api.room.leaveFailed");
  }
}

let currentMode: GameModeStrategy = new SoloModeStrategy();

export function getCurrentMode(): GameModeStrategy {
  return currentMode;
}

export function initNameControls(): void {
  addBtn.addEventListener("click", async () => {
    await currentMode.addCustomNameToWheel(input.value);
  });

  input.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      await currentMode.addCustomNameToWheel(input.value);
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
      tag.textContent = t("room.host");
      tag.className = 'room__host-tag';
      li.appendChild(tag);
    }

    if (currentMode.canManagePlayers()) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'room__player-toggle-btn';
      const inWheel = (roomNames ?? []).includes(name);
      toggle.textContent = inWheel ? '−' : '+';
      if (inWheel) toggle.classList.add('room__player-toggle-btn--added');
      toggle.title = inWheel ? t("room.removeFromWheel", { name }) : t("room.addToWheel", { name });
      toggle.setAttribute("aria-label", toggle.title);

      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          if ((roomNames ?? []).includes(name)) {
            await currentMode.removePlayerNameFromWheel(name);
          } else {
            await currentMode.addPlayerNameToWheel(name);
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
  applyGameModeLock();
}

// Called on Realtime player-list updates.
function syncRoomPlayers(players: string[]): void {
  if (!activeRoomKey) return;
  currentPlayers = [...players];
  renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  applyGameModeLock();
}

const roomKeyDisplay = optionalElement<HTMLSpanElement>("room-key-display");
const roomInfo = optionalElement<HTMLDivElement>("room-info");

function setRoomActive(roomKey: string, host: boolean): void {
  activeRoomKey = roomKey;
  currentMode = host ? new HostModeStrategy() : new GuestModeStrategy();
  if (host) {
    lockNameEditing(false, false);
  } else {
    lockNameEditing(true, true);
  }
  setHostControlsVisibility(host);
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  applyGameModeLock();
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
  setOnNameInWheelListRemoved(null);
  unlockNameEditing();
  unsubscribeFromRoom();
  currentMode = new SoloModeStrategy();
  activeRoomKey = null;
  activeRoomHostName = '';
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  if (multiplierSyncListener) {
    multiplierSlider?.removeEventListener('input', multiplierSyncListener);
    multiplierSyncListener = null;
  }
  applyGameModeLock();
  setHostControlsVisibility(false);
  renderPlayersSidebar([]);
  replaceNames(savedNames);
  updateWheelEmptyState();
  destroyChat();
}

// Non-host only: realtime fires → spin wheel visually (no coins, winner determined locally for display)
function handleRoomSpinEvent(lastSpin: number, multiplier: number, direction: string): void {
  if (currentMode instanceof HostModeStrategy) return; // host already spun directly from POST response
  lockAllSpinElements();
  const names = getNamesInWheelList();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + lastSpin;
  spinWheel(totalSteps, direction as Direction, '', names);
}

// closeWinnerModal=false → "Reset"-Button: nur die Rad-Rotation wird für alle zurückgesetzt.
// closeWinnerModal=true → OK im WinnerModal: Rad-Rotation UND Modal werden für alle zurückgesetzt.
async function handleRoomReset(closeWinnerModal: boolean): Promise<void> {
  if (!activeRoomKey) return; // nur für TS-Typsicherheit — currentMode ist hier immer HostModeStrategy
  try {
    await resetRoom(activeRoomKey, closeWinnerModal);
    // Lokal passiert nichts hier direkt — das übernehmen handleWheelResetEvent()/
    // handleWinnerModalCloseEvent(), sobald das Realtime-Update zurückkommt,
    // damit der Host synchron mit allen anderen Spielern zurücksetzt statt
    // vorzupreschen.
  } catch (error) {
    console.error('[ROOM] Reset fehlgeschlagen:', error);
    showToast({ message: t("api.room.resetFailed"), type: 'error' });
  }
}

function handleWheelResetEvent(): void {
  resetWheelRotation(); // ruft intern applyGameModeLock() auf — Rollen-Sperre wird dabei automatisch neu hergestellt
}

function handleWinnerModalCloseEvent(): void {
  hideWinnerModal();
}

function onRoomClosed(): void {
  if (currentMode instanceof HostModeStrategy) return; // host handles its own leave flow
  clearRoom();
  showToast({ message: t("room.hostClosed"), type: 'info' });
}

function setNamesFromRoom(names: string[]): void {
  roomNames = [...names];
  replaceNames(names);
  updateWheelEmptyState();
  // refresh player sidebar buttons so their toggle state updates
  if (currentPlayers.length > 0) renderPlayersSidebar(currentPlayers);
  updateBulkButtonState(currentPlayers);
  applyGameModeLock();
}

function updateBulkButtonState(players: string[]): void {
  if (!bulkAddToWheelBtn) return;
  const anyMissing = players.some((p) => !(roomNames ?? []).includes(p));
  if (anyMissing) {
    bulkAddToWheelBtn.textContent = t("room.bulkAdd");
    bulkAddToWheelBtn.classList.remove('room__btn--remove');
  } else {
    bulkAddToWheelBtn.textContent = t("room.bulkRemove");
    bulkAddToWheelBtn.classList.add('room__btn--remove');
  }
}

export async function executeLeaveRoom(): Promise<void> {
  const leavingMode = currentMode;
  const roomKey = activeRoomKey;
  clearRoom(); // unsubscribe first so we don't receive our own close event
  if (roomKey) {
    try {
      await leaveRoom(roomKey);
      showToast({ message: leavingMode.getLeaveResultMessage(true), type: 'success' });
    } catch {
      showToast({ message: leavingMode.getLeaveResultMessage(false), type: 'error' });
    }
  }
}

async function executeCreateRoom(): Promise<void> {
  try {
    if (activeRoomKey) {
      clearRoom();
    }
    const { roomKey, players, names } = await createRoom();
    activeRoomHostName = players[0] ?? '';
    setRoomActive(roomKey, true);
    initRoomPlayers(players);
    setNamesFromRoom(names ?? []);
    subscribeToRoom(
      roomKey,
      handleRoomSpinEvent,
      syncRoomPlayers,
      onRoomClosed,
      (m) => { setMultiplierSlider(m); updateMultiplierDisplay(); },
      setNamesFromRoom,
      handleWheelResetEvent,
      handleWinnerModalCloseEvent
    );
    initChat(roomKey, myUsername);
    multiplierSyncListener = () => {
      if (!activeRoomKey) return;
      void setMultiplier(activeRoomKey, getMultiplier());
    };
    multiplierSlider?.addEventListener('input', multiplierSyncListener);
    showToast({ message: t("room.created", { roomKey }), type: 'success' });
  } catch (error) {
    console.error('[ROOM] Erstellen fehlgeschlagen:', error);
    showToast({ message: t("api.room.createFailed"), type: 'error' });
  }
}

async function executeJoinRoom(roomKey: string): Promise<void> {
  try {
    if (activeRoomKey) {
      clearRoom();
    }
    const { players, multiplier, names, hostName } = await joinRoom(roomKey);
    activeRoomHostName = hostName;
    setRoomActive(roomKey, false);
    initRoomPlayers(players);
    setNamesFromRoom(names ?? []);
    setMultiplierSlider(multiplier);
    updateMultiplierDisplay();
    subscribeToRoom(
      roomKey,
      handleRoomSpinEvent,
      syncRoomPlayers,
      onRoomClosed,
      (m) => { setMultiplierSlider(m); updateMultiplierDisplay(); },
      setNamesFromRoom,
      handleWheelResetEvent,
      handleWinnerModalCloseEvent
    );
    initChat(roomKey, myUsername);
    showToast({ message: t("room.joined", { roomKey }), type: 'success' });
  } catch (error) {
    console.error('[ROOM] Beitreten fehlgeschlagen:', error);
    showToast({ message: t("api.room.joinFailed"), type: 'error' });
  }
}

let pendingRoomAction: (() => Promise<void>) | null = null;
let pendingRoomMessageKey: string | null = null;
let pendingRoomMessageValues: Record<string, unknown> | undefined;
const leaveRoomConfirmModal = optionalElement<HTMLDialogElement>("leave-room-confirm-modal");
const leaveRoomConfirmMessage = optionalElement<HTMLParagraphElement>("leave-room-confirm-message");

function renderPendingRoomMessage(): void {
  if (!leaveRoomConfirmMessage || !pendingRoomMessageKey) return;
  leaveRoomConfirmMessage.textContent = t(pendingRoomMessageKey, pendingRoomMessageValues);
}

export function showSwitchRoomConfirm(messageKey: string, action: () => Promise<void>, values?: Record<string, unknown>): void {
  pendingRoomMessageKey = messageKey;
  pendingRoomMessageValues = values;
  renderPendingRoomMessage();
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
  window.addEventListener("app:language-changed", () => {
    renderPlayersSidebar(currentPlayers);
    updateBulkButtonState(currentPlayers);
    renderPendingRoomMessage();
  });
  setOnNameInWheelListRemoved(async (removedName: string): Promise<void> => {
    await currentMode.removeNameFromWheel(removedName);
  });

  bulkAddToWheelBtn?.addEventListener('click', async () => {
    const players = Array.from(playersList?.querySelectorAll('.room__player-name') ?? [])
      .map((node) => node.textContent?.trim() ?? '');
    await currentMode.addAllPlayersToWheel(players);
  });

  createRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: t("room.waitForWheelStop"), type: 'error' });
      return;
    }
    if (!activeRoomKey) savedNames = getNamesInWheelList();
    if (activeRoomKey) {
      showSwitchRoomConfirm(
        "room.switchToNewRoom",
        executeCreateRoom,
        { currentRoom: activeRoomKey },
      );
      return;
    }
    void executeCreateRoom();
  });

  joinRoomBtn?.addEventListener('click', () => {
    const roomKey = roomKeyInput?.value.trim().toUpperCase() ?? '';
    if (!roomKey) return;
    if (isSpinning()) {
      showToast({ message: t("room.waitForWheelStop"), type: 'error' });
      return;
    }
    if (!activeRoomKey) savedNames = getNamesInWheelList();
    if (activeRoomKey) {
      showSwitchRoomConfirm(
        "room.switchRoom",
        () => executeJoinRoom(roomKey),
        { currentRoom: activeRoomKey, targetRoom: roomKey },
      );
      return;
    }
    void executeJoinRoom(roomKey);
  });

  leaveRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: t("room.waitForWheelStop"), type: 'error' });
      return;
    }
    if (leaveRoomConfirmMessage) {
      const guestCount = currentPlayers.length - 1;
      pendingRoomMessageKey = currentMode instanceof HostModeStrategy && guestCount > 0
        ? "room.leaveConfirmGuests"
        : currentMode instanceof HostModeStrategy
          ? "room.leaveConfirmHost"
          : "room.leaveConfirmGuest";
      pendingRoomMessageValues = pendingRoomMessageKey === "room.leaveConfirmGuests" ? { count: guestCount } : undefined;
      renderPendingRoomMessage();
    }
    leaveRoomConfirmModal?.showModal();
  });

  confirmLeaveRoomBtn?.addEventListener('click', () => {
    leaveRoomConfirmModal?.close();
    if (pendingRoomAction) {
      const action = pendingRoomAction;
      pendingRoomAction = null;
      pendingRoomMessageKey = null;
      pendingRoomMessageValues = undefined;
      void action();
    } else {
      void executeLeaveRoom();
    }
  });

  cancelLeaveRoomBtn?.addEventListener('click', () => {
    leaveRoomConfirmModal?.close();
    pendingRoomAction = null;
    pendingRoomMessageKey = null;
    pendingRoomMessageValues = undefined;
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
      showToast({ message: t("room.copied"), type: 'success' });
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
