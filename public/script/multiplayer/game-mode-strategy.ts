import {
  spinWheel, spinWheelWithRandomSteps, lockAllSpinElements, applyGameModeLock,
  resetWheelRotation,
  spinLeftBtn, spinRightBtn, resetBtn,
  MIN_SPIN_ROTATIONS,
} from "../wheel/spin";
import type { Direction, SpinElement } from "../wheel/spin";
import { getMultiplier, multiplierSlider } from "../wheel/multiplier";
import { hideWinnerModal } from "../wheel/winner";
import {
  addNameToList, getNamesInWheelList,
  addBtn, input, getRemoveBtn,
} from "../names/names-in-wheel-list";
import { getNameValidationMessage } from "../names/name-input-validation";
import { MAX_ITEMS } from "../names/names-in-wheel-list-state";
import { validateName } from "../shared/validation";
import { showToast } from "../shared/toast";
import { spinRoom, updateRoomNames, resetRoom } from "../api/room-api";
import { activeRoomKey, activeRoomNamesInWheelList, getMissingPlayers } from "./room-state";

export interface GameModeStrategy {
  onSpinClick(direction: Direction): Promise<void>;
  onReset(): void;
  onWinnerModalClose(): void;
  getRoleLockedElements(): SpinElement[];
  addNameToWheel(rawName: string): Promise<void>;
  removeNameFromWheel(index: number): Promise<void>;
  toggleAllPlayersInWheel(players: string[]): Promise<void>;
  canManagePlayers(): boolean;
  isHost(): boolean;
  getLeaveConfirmMessage(guestCount: number): string;
  getLeaveResultMessage(success: boolean): string;
}

export class SoloModeStrategy implements GameModeStrategy {
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

  async addNameToWheel(rawName: string): Promise<void> {
    addNameToList(rawName);
  }

  async removeNameFromWheel(): Promise<void> {
    // no-op — lokales Entfernen läuft direkt über die Namensliste, nicht über den Raum-Callback
  }

  async toggleAllPlayersInWheel(): Promise<void> {
    // no-op — es gibt keine Mitspielerliste ohne Raum
  }

  canManagePlayers(): boolean {
    return false;
  }

  isHost(): boolean {
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

// Nur von HostModeStrategy.onReset()/onWinnerModalClose() verwendet — deshalb
// hier co-located statt in der Orchestrierung, sonst entsteht ein Zyklus
// (Orchestrierung importiert bereits GameModeStrategy für setCurrentMode()).
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

export class HostModeStrategy implements GameModeStrategy {
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

  async addNameToWheel(rawName: string): Promise<void> {
    if (!activeRoomKey) return;

    const validation = validateName(rawName);
    if (!validation.valid) {
      showToast({ message: getNameValidationMessage(validation.code), type: 'error' });
      return;
    }

    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    if (existingNamesInWheelList.length >= MAX_ITEMS) {
      showToast({ message: `Maximal ${MAX_ITEMS} Einträge erlaubt.`, type: 'error' });
      return;
    }

    const updatedNamesInWheelList = [...existingNamesInWheelList, validation.value];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
    input.value = '';
  }

  async removeNameFromWheel(index: number): Promise<void> {
    if (!activeRoomKey) return;
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    if (index < 0 || index >= existingNamesInWheelList.length) return;
    const updatedNamesInWheelList = [...existingNamesInWheelList.slice(0, index), ...existingNamesInWheelList.slice(index + 1)];
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  async toggleAllPlayersInWheel(players: string[]): Promise<void> {
    if (!activeRoomKey) return;
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const missingPlayers = getMissingPlayers(players, existingNamesInWheelList);

    if (missingPlayers.length > 0) {
      const updatedNamesInWheelList = [...existingNamesInWheelList, ...missingPlayers];
      if (updatedNamesInWheelList.length > MAX_ITEMS) {
        showToast({ message: `Maximal ${MAX_ITEMS} Einträge erlaubt.`, type: 'error' });
        return;
      }
      await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
      return;
    }

    const updatedNamesInWheelList = existingNamesInWheelList.filter((existingName) => !players.includes(existingName));
    await updateRoomNames(activeRoomKey, updatedNamesInWheelList);
  }

  canManagePlayers(): boolean {
    return true;
  }

  isHost(): boolean {
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
// (handleRoomSpinEvent, handleWheelResetEvent, setNamesFromRoom in room-orchestration.ts).
export class GuestModeStrategy implements GameModeStrategy {
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

  async addNameToWheel(rawName: string): Promise<void> {
    // unerreichbar in der Praxis (Eingabefeld ist für Gäste gesperrt) —
    // Fallback identisch zu Solo, falls der Guard doch mal umgangen wird
    addNameToList(rawName);
  }

  async removeNameFromWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Namensliste
  }

  async toggleAllPlayersInWheel(): Promise<void> {
    // no-op — nur der Host verwaltet die Mitspielerliste
  }

  canManagePlayers(): boolean {
    return false;
  }

  isHost(): boolean {
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

export function setCurrentMode(mode: GameModeStrategy): void {
  currentMode = mode;
}
