import { getNamesInWheelList, replaceNames, lockNameEditing, unlockNameEditing } from "../names/names-in-wheel-list";
import {
  spinWheel, lockAllSpinElements, applyGameModeLock,
  resetWheelRotation,
  MIN_SPIN_ROTATIONS,
} from "../wheel/spin";
import type { Direction } from "../wheel/spin";
import {
  getMultiplier,
  MULTIPLIER_CHANGE_EVENT,
  multiplierButton,
  setMultiplierControlValue,
} from "../wheel/multiplier";
import { hideWinnerModal } from "../wheel/winner";
import { initChat, destroyChat } from "./room-chat";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";
import { createRoom, leaveRoom, joinRoom, setMultiplier } from '../api/room-api';
import { subscribeToRoom, unsubscribeFromRoom } from "./room-realtime-sync";
import {
  activeRoomKey, setActiveRoomKey,
  activeRoomPlayers, setActiveRoomPlayers,
  setActiveRoomNamesInWheelList,
  setActiveRoomHostName,
  consumePendingHostSpinToken, setPendingHostSpinToken,
  roomKeyDisplay, roomInfo,
} from "./room-state";
import { getCurrentMode, setCurrentMode, SoloModeStrategy, HostModeStrategy, GuestModeStrategy } from "./game-mode-strategy";
import { renderPlayersSidebar, setHostControlsVisibility, updateWheelEmptyState, updateBulkButtonState } from "./room-players-sidebar";

let myUsername = '';

export function setMyUsername(newUsername: string): void {
  myUsername = newUsername;
}

function setRoomActive(roomKey: string, host: boolean): void {
  setActiveRoomKey(roomKey);
  setCurrentMode(host ? new HostModeStrategy() : new GuestModeStrategy());
  lockNameEditing();
  setHostControlsVisibility();
  if (roomKeyDisplay) roomKeyDisplay.textContent = roomKey;
  if (roomInfo) roomInfo.classList.remove('hidden');

  applyGameModeLock();
}

let namesBeforeJoiningRoom: string[] = [];
let multiplierSyncListener: (() => void) | null = null;

// Merkt sich den lokalen Solo-Wheel-Stand, bevor ein Raum erstellt/betreten
// wird, damit clearRoom() ihn beim Verlassen wiederherstellen kann.
export function backupNamesBeforeJoiningRoom(): void {
  if (!activeRoomKey) namesBeforeJoiningRoom = getNamesInWheelList();
}

function clearRoom(): void {
  setActiveRoomPlayers([]);
  setActiveRoomNamesInWheelList([]);
  setPendingHostSpinToken('');
  unlockNameEditing();
  unsubscribeFromRoom();
  setCurrentMode(new SoloModeStrategy());
  setActiveRoomKey(null);
  setActiveRoomHostName('');
  if (roomKeyDisplay) roomKeyDisplay.textContent = '';
  if (roomInfo) roomInfo.classList.add('hidden');
  if (multiplierSyncListener) {
    multiplierButton.removeEventListener(MULTIPLIER_CHANGE_EVENT, multiplierSyncListener);
    multiplierSyncListener = null;
  }
  applyGameModeLock();
  setHostControlsVisibility();
  renderPlayersSidebar([]);
  replaceNames(namesBeforeJoiningRoom);
  updateWheelEmptyState();
  destroyChat();
}

function updateRoomPlayers(players: string[]): void {
  setActiveRoomPlayers([...players]);
  renderPlayersSidebar(activeRoomPlayers);
  updateBulkButtonState(activeRoomPlayers);
  applyGameModeLock();
}

// Called once when creating or joining a room — sidebar gets the full player
// list, the wheel itself starts empty until setNamesFromRoom() applies
// the room's persisted names-in-wheel-list selection.
function initRoomPlayers(players: string[]): void {
  replaceNames([]);
  updateRoomPlayers(players);
}

// Called on Realtime player-list updates.
function syncRoomPlayers(players: string[]): void {
  if (!activeRoomKey) return;
  updateRoomPlayers(players);
}

// Realtime fires für Host und Gast gleichermaßen → beide spinnen erst hier, synchron
// zueinander. Nur der Host bringt einen echten Spin-Token mit (aus dem eigenen
// spinRoom()-Call zwischengespeichert), der Gast bekommt nie einen — Coins werden
// nur mit einem gültigen, serverseitig geprüften Token vergeben.
function handleRoomSpinEvent(extraRotationDegrees: number, multiplier: number, direction: string, winnerName: string): void {
  lockAllSpinElements();
  const namesInWheelList = getNamesInWheelList();
  const totalSteps = Math.round(MIN_SPIN_ROTATIONS * multiplier) + extraRotationDegrees;
  const spinToken = getCurrentMode().isHost() ? consumePendingHostSpinToken() : '';
  spinWheel(totalSteps, direction as Direction, spinToken, namesInWheelList, winnerName);
}

function handleWheelResetEvent(): void {
  resetWheelRotation(); // ruft intern applyGameModeLock() auf — Rollen-Sperre wird dabei automatisch neu hergestellt
}

function handleWinnerModalCloseEvent(): void {
  hideWinnerModal();
}

function onRoomClosed(): void {
  if (getCurrentMode().isHost()) return; // host handles its own leave flow
  clearRoom();
  showToast({ message: t('room.hostClosed'), type: 'info' });
}

function setNamesFromRoom(names: string[]): void {
  setActiveRoomNamesInWheelList([...names]);
  replaceNames(names);
  updateWheelEmptyState();
  // refresh player sidebar buttons so their toggle state updates
  if (activeRoomPlayers.length > 0) renderPlayersSidebar(activeRoomPlayers);
  updateBulkButtonState(activeRoomPlayers);
  applyGameModeLock();
}

// Gemeinsamer Schlussteil von executeCreateRoom/executeJoinRoom: Realtime-
// Abo (identisch für Host und Gast) + Chat-Start.
function finishRoomSetup(roomKey: string): void {
  subscribeToRoom(
    roomKey,
    handleRoomSpinEvent,
    syncRoomPlayers,
    onRoomClosed,
    setMultiplierControlValue,
    setNamesFromRoom,
    handleWheelResetEvent,
    handleWinnerModalCloseEvent
  );
  initChat(roomKey, myUsername);
}

export async function executeLeaveRoom(): Promise<void> {
  const leavingMode = getCurrentMode();
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

export async function executeCreateRoom(): Promise<void> {
  try {
    if (activeRoomKey) {
      clearRoom();
    }
    const { roomKey, players, names } = await createRoom();
    setActiveRoomHostName(players[0] ?? '');
    setRoomActive(roomKey, true);
    initRoomPlayers(players);
    setNamesFromRoom(names.map((entry) => entry.text));
    finishRoomSetup(roomKey);
    multiplierSyncListener = () => {
      if (!activeRoomKey) return;
      void setMultiplier(activeRoomKey, getMultiplier());
    };
    multiplierButton.addEventListener(MULTIPLIER_CHANGE_EVENT, multiplierSyncListener);
    showToast({ message: t('room.created', { roomKey }), type: 'success' });
  } catch (error) {
    console.error('[ROOM] Erstellen fehlgeschlagen:', error);
    showToast({ message: t('api.room.createFailed'), type: 'error' });
  }
}

export async function executeJoinRoom(roomKey: string): Promise<void> {
  try {
    if (activeRoomKey) {
      clearRoom();
    }
    const { players, multiplier, names, hostName } = await joinRoom(roomKey);
    setActiveRoomHostName(hostName);
    setRoomActive(roomKey, false);
    initRoomPlayers(players);
    setNamesFromRoom(names.map((entry) => entry.text));
    setMultiplierControlValue(multiplier);
    finishRoomSetup(roomKey);
    showToast({ message: t('room.joined', { roomKey }), type: 'success' });
  } catch (error) {
    console.error('[ROOM] Beitreten fehlgeschlagen:', error);
    showToast({ message: t('api.room.joinFailed'), type: 'error' });
  }
}
