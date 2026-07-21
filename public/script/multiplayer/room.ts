import { supabaseClient } from '../shared/supabase-client';
import type { RealtimeChannel, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { optionalElement } from "../shared/dom-helpers";
import {
  addNameToList, getNamesInWheelList, replaceNames,
  lockNameEditing, unlockNameEditing, setOnNameInWheelListRemoved,
  addBtn, input, getRemoveBtn,
} from "../names/names-in-wheel-list";
import {
  spinWheel, spinWheelWithRandomSteps, lockAllSpinElements, applyGameModeLock,
  resetWheelRotation, isSpinning,
  spinLeftBtn, spinRightBtn, resetBtn,
  MIN_SPIN_ROTATIONS,
} from "../wheel/spin";
import type { Direction, SpinElement } from "../wheel/spin";
import {
  getMultiplier, setMultiplierSlider,
  updateMultiplierDisplay,
  multiplierSlider,
} from "../wheel/multiplier";
import { hideWinnerModal } from "../wheel/winner";
import { initChat, destroyChat } from "./chat";
import { showToast } from "../shared/toast";
import {
  createRoom,
  leaveRoom,
  joinRoom,
  spinRoom,
  leaveRoomOnUnload,
  resetRoom,
  updateRoomNames,
  setMultiplier
} from '../api/room-api';

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
let lastKnownNamesInWheelListJson = '';
let lastKnownMultiplier: number | null = null;
let lastKnownWheelResetAt = '';
let lastKnownWinnerModalCloseAt = '';

export function subscribeToRoom(
  roomKey: string,
  onSpin: (extraRotationDegrees: number, multiplier: number, direction: string) => void,
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
        const updatedRoom = payload.new;

        if (Array.isArray(updatedRoom.players)) {
          // players = [] signals the host closed the room
          if (updatedRoom.players.length === 0) {
            onClose?.();
            return;
          }

          // Only call onPlayersUpdate when the player list actually changed (not on spin events)
          const playersJson = JSON.stringify(updatedRoom.players);
          if (playersJson !== lastKnownPlayersJson) {
            lastKnownPlayersJson = playersJson;
            onPlayersUpdate?.(updatedRoom.players.map((player) => player.username));
          }
        }

        if (Array.isArray(updatedRoom.names_in_wheel)) {
          const namesInWheelListJson = JSON.stringify(updatedRoom.names_in_wheel);
          if (namesInWheelListJson !== lastKnownNamesInWheelListJson) {
            lastKnownNamesInWheelListJson = namesInWheelListJson;
            onNamesUpdate?.(updatedRoom.names_in_wheel);
          }
        }

        // Notify when the host changes the multiplier
        const newMultiplier = updatedRoom.multiplier ?? 1;
        if (newMultiplier !== lastKnownMultiplier) {
          lastKnownMultiplier = newMultiplier;
          onMultiplierUpdate?.(newMultiplier);
        }

        // Jede Spalte trägt genau ein Ereignis und wird unabhängig von den anderen ausgewertet.
        // Ein Reset-Write fasst last_spin/spun_at nie an — ein solches Update darf also nie
        // als Spin interpretiert werden, sonst spielen Gäste die Rad-Animation erneut ab.
        let resetEventHandled = false;

        if (updatedRoom.wheel_reset_at && updatedRoom.wheel_reset_at !== lastKnownWheelResetAt) {
          lastKnownWheelResetAt = updatedRoom.wheel_reset_at;
          onWheelReset?.();
          resetEventHandled = true;
        }

        if (updatedRoom.winner_modal_close_at && updatedRoom.winner_modal_close_at !== lastKnownWinnerModalCloseAt) {
          lastKnownWinnerModalCloseAt = updatedRoom.winner_modal_close_at;
          onWinnerModalClose?.();
          resetEventHandled = true;
        }

        if (resetEventHandled) return;

        if (!updatedRoom.spun_at) return;
        const ageMs = Date.now() - new Date(updatedRoom.spun_at).getTime();
        if (ageMs > 5000) return;

        onSpin(updatedRoom.last_spin, newMultiplier, updatedRoom.spin_direction ?? 'right');

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
  lastKnownNamesInWheelListJson = '';
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
    return 'Raum wirklich verlassen?';
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? 'Raum verlassen' : 'Raum konnte nicht verlassen werden';
  }
}

class HostModeStrategy implements GameModeStrategy {
  async onSpinClick(direction: Direction): Promise<void> {
    if (!activeRoomKey) return; // nur für TS-Typsicherheit — currentMode ist hier immer HostModeStrategy
    lockAllSpinElements();
    try {
      const namesInWheelList = getNamesInWheelList();
      const { ranNum: extraRotationDegrees, spinToken } = await spinRoom(activeRoomKey, namesInWheelList, direction);
      const totalSteps = Math.round(MIN_SPIN_ROTATIONS * getMultiplier()) + extraRotationDegrees;
      spinWheel(totalSteps, direction, spinToken, namesInWheelList);
    } catch (error) {
      console.error('[ROOM] Spin fehlgeschlagen:', error);
      applyGameModeLock();
      showToast({ message: 'Spin fehlgeschlagen', type: 'error' });
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
    const updatedNamesInWheelList = [...(activeRoomNamesInWheelList ?? []), trimmed];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
    input.value = '';
  }

  async addPlayerNameToWheel(playerName: string): Promise<void> {
    if (!activeRoomKey) return;
    const updatedNamesInWheelList = [...(activeRoomNamesInWheelList ?? []), playerName];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  async removeNameFromWheel(name: string): Promise<void> {
    if (!activeRoomKey) return;
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const index = existingNamesInWheelList.findIndex((existingName) => existingName === name);
    if (index < 0) return;
    const updatedNamesInWheelList = [...existingNamesInWheelList.slice(0, index), ...existingNamesInWheelList.slice(index + 1)];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  async removePlayerNameFromWheel(playerName: string): Promise<void> {
    if (!activeRoomKey) return;
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const index = existingNamesInWheelList.findIndex((existingName) => existingName === playerName);
    if (index < 0) return;
    const updatedNamesInWheelList = [...existingNamesInWheelList.slice(0, index), ...existingNamesInWheelList.slice(index + 1)];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  async addAllPlayersToWheel(players: string[]): Promise<void> {
    if (!activeRoomKey) return;
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const missingPlayers = players.filter((player) => !existingNamesInWheelList.includes(player));

    if (missingPlayers.length > 0) {
      const updatedNamesInWheelList = [...existingNamesInWheelList, ...missingPlayers];
      await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
      return;
    }

    const updatedNamesInWheelList = existingNamesInWheelList.filter((existingName) => !players.includes(existingName));
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  canManagePlayers(): boolean {
    return true;
  }

  getLeaveConfirmMessage(guestCount: number): string {
    if (guestCount > 0) {
      return `Du bist Host von ${guestCount} ${guestCount === 1 ? 'Mitspieler' : 'Mitspielern'}. Raum wirklich schließen?`;
    }
    return 'Raum wirklich schließen?';
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? 'Raum geschlossen' : 'Raum konnte nicht geschlossen werden';
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
    return 'Raum wirklich verlassen?';
  }

  getLeaveResultMessage(success: boolean): string {
    return success ? 'Raum verlassen' : 'Raum konnte nicht verlassen werden';
  }
}

let currentMode: GameModeStrategy = new SoloModeStrategy();

export function getCurrentMode(): GameModeStrategy {
  return currentMode;
}

export function initAddNameInput(): void {
  addBtn.addEventListener("click", async () => {
    await currentMode.addCustomNameToWheel(input.value);
  });

  input.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      await currentMode.addCustomNameToWheel(input.value);
    }
  });
}


let activeRoomNamesInWheelList: string[] = [];
let activeRoomHostName = '';
const playersList = optionalElement<HTMLUListElement>("room-players-list");

function renderPlayersSidebar(players: string[]): void {
  if (!playersList) return;
  const playersListElement = playersList;
  playersListElement.innerHTML = '';

  players.forEach((name) => {
    const playerEntry = document.createElement('li');
    playerEntry.className = 'room__player-item';

    const nameLabel = document.createElement('span');
    nameLabel.className = 'room__player-name';
    nameLabel.textContent = name;
    playerEntry.appendChild(nameLabel);

    if (name === activeRoomHostName) {
      const hostTag = document.createElement('span');
      hostTag.textContent = 'Host';
      hostTag.className = 'room__host-tag';
      playerEntry.appendChild(hostTag);
    }

    if (currentMode.canManagePlayers()) {
      const togglePlayerInWheelListBtn = document.createElement('button');
      togglePlayerInWheelListBtn.type = 'button';
      togglePlayerInWheelListBtn.className = 'room__player-toggle-btn';
      const isPlayerInWheelList = (activeRoomNamesInWheelList ?? []).includes(name);
      togglePlayerInWheelListBtn.textContent = isPlayerInWheelList ? '−' : '+';
      if (isPlayerInWheelList) togglePlayerInWheelListBtn.classList.add('room__player-toggle-btn--added');
      togglePlayerInWheelListBtn.title = isPlayerInWheelList ? `Vom Rad entfernen: ${name}` : `Zu Rad hinzufügen: ${name}`;

      togglePlayerInWheelListBtn.addEventListener('click', async () => {
        togglePlayerInWheelListBtn.disabled = true;
        try {
          if ((activeRoomNamesInWheelList ?? []).includes(name)) {
            await currentMode.removePlayerNameFromWheel(name);
          } else {
            await currentMode.addPlayerNameToWheel(name);
          }
        } catch (error) {
          console.error('[ROOM] toggle player failed', error);
        } finally {
          togglePlayerInWheelListBtn.disabled = false;
        }
      });

      playerEntry.appendChild(togglePlayerInWheelListBtn);
    }

    playersListElement.appendChild(playerEntry);
  });
}

export const bulkAddToWheelBtn = optionalElement<HTMLButtonElement>("room-bulk-add-btn");

function setHostControlsVisibility(host: boolean): void {
  if (bulkAddToWheelBtn) {
    bulkAddToWheelBtn.classList.toggle('hidden', !host);
  }

  const hostOnlyInputs = [input, addBtn];
  hostOnlyInputs.forEach((element) => {
    if (!element) return;
    element.disabled = !host;
    element.style.opacity = host ? '1' : '0.5';
    element.style.cursor = host ? 'text' : 'not-allowed';
  });
}

export const wheelEmptyHint = optionalElement<HTMLDivElement>("wheel-empty-hint");

function updateWheelEmptyState(): void {
  if (!wheelEmptyHint) return;
  wheelEmptyHint.classList.toggle('hidden', getNamesInWheelList().length > 0);
}

// Called once when creating or joining a room — sidebar gets the full player
// list, the wheel itself starts empty until setNamesFromRoom() applies
// the room's persisted names-in-wheel-list selection.
let activeRoomPlayers: string[] = [];

export function initRoomPlayers(players: string[]): void {
  activeRoomPlayers = [...players];
  replaceNames([]);
  renderPlayersSidebar(activeRoomPlayers);
  updateBulkButtonState(activeRoomPlayers);
  applyGameModeLock();
}

// Called on Realtime player-list updates.
function syncRoomPlayers(players: string[]): void {
  if (!activeRoomKey) return;
  activeRoomPlayers = [...players];
  renderPlayersSidebar(activeRoomPlayers);
  updateBulkButtonState(activeRoomPlayers);
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

let namesBeforeJoiningRoom: string[] = [];
let nameStateUnsubscribe: (() => void) | null = null;
let multiplierSyncListener: (() => void) | null = null;

function clearRoom(): void {
  if (nameStateUnsubscribe) {
    nameStateUnsubscribe();
    nameStateUnsubscribe = null;
  }
  activeRoomPlayers = [];
  activeRoomNamesInWheelList = [];
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
  replaceNames(namesBeforeJoiningRoom);
  updateWheelEmptyState();
  destroyChat();
}

// Non-host only: realtime fires → spin wheel visually (no coins, winner determined locally for display)
function handleRoomSpinEvent(extraRotationDegrees: number, multiplier: number, direction: string): void {
  if (currentMode instanceof HostModeStrategy) return; // host already spun directly from POST response
  lockAllSpinElements();
  const namesInWheelList = getNamesInWheelList();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + extraRotationDegrees;
  spinWheel(totalSteps, direction as Direction, '', namesInWheelList);
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
    showToast({ message: 'Reset fehlgeschlagen', type: 'error' });
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
  showToast({ message: 'Der Host hat den Raum geschlossen', type: 'info' });
}

function setNamesFromRoom(names: string[]): void {
  activeRoomNamesInWheelList = [...names];
  replaceNames(names);
  updateWheelEmptyState();
  // refresh player sidebar buttons so their toggle state updates
  if (activeRoomPlayers.length > 0) renderPlayersSidebar(activeRoomPlayers);
  updateBulkButtonState(activeRoomPlayers);
  applyGameModeLock();
}

function updateBulkButtonState(players: string[]): void {
  if (!bulkAddToWheelBtn) return;
  const anyMissing = players.some((player) => !(activeRoomNamesInWheelList ?? []).includes(player));
  if (anyMissing) {
    bulkAddToWheelBtn.textContent = 'Alle zum Rad hinzufügen';
    bulkAddToWheelBtn.classList.remove('room__btn--remove');
  } else {
    bulkAddToWheelBtn.textContent = 'Alle vom Rad entfernen';
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
      (multiplier) => { setMultiplierSlider(multiplier); updateMultiplierDisplay(); },
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
    showToast({ message: `Raum erstellt: ${roomKey}`, type: 'success' });
  } catch (error) {
    console.error('[ROOM] Erstellen fehlgeschlagen:', error);
    showToast({ message: 'Raum konnte nicht erstellt werden', type: 'error' });
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
      (multiplier) => { setMultiplierSlider(multiplier); updateMultiplierDisplay(); },
      setNamesFromRoom,
      handleWheelResetEvent,
      handleWinnerModalCloseEvent
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

export function showSwitchRoomConfirm(message: string, action: () => Promise<void>): void {
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

export function initRoomButtons(): void {
  setOnNameInWheelListRemoved(async (removedName: string): Promise<void> => {
    await currentMode.removeNameFromWheel(removedName);
  });

  bulkAddToWheelBtn?.addEventListener('click', async () => {
    const players = Array.from(playersList?.querySelectorAll('.room__player-name') ?? [])
      .map((nameElement) => nameElement.textContent?.trim() ?? '');
    await currentMode.addAllPlayersToWheel(players);
  });

  createRoomBtn?.addEventListener('click', () => {
    if (isSpinning()) {
      showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
      return;
    }
    if (!activeRoomKey) namesBeforeJoiningRoom = getNamesInWheelList();
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
    if (!activeRoomKey) namesBeforeJoiningRoom = getNamesInWheelList();
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
      const guestCount = activeRoomPlayers.length - 1;
      leaveRoomConfirmMessage.textContent = currentMode.getLeaveConfirmMessage(guestCount);
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
    const roomKeyText = roomKeyDisplay?.textContent ?? '';
    if (!roomKeyText) return;
    void navigator.clipboard.writeText(roomKeyText).then(() => {
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
