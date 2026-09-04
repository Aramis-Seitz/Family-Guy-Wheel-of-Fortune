import {
  spinWheelWithRandomSteps, applyGameModeLock,
  resetWheelRotation,
  spinBtn, resetBtn,
} from "../wheel/spin";
import type { Direction, SpinElement } from "../wheel/spin";
import { multiplierButton } from "../wheel/multiplier";
import { hideWinnerModal } from "../wheel/winner";
import {
  addNameToList,
  addBtn, input, getRemoveBtn, removeNameFromListByIndex,
} from "../names/names-in-wheel-list";
import { getNameValidationMessage } from "../names/name-input-validation";
import { MAX_ITEMS, isNameInWheelList } from "../names/names-in-wheel-list-state";
import { validateName } from "../shared/validation";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";
import { spinRoom, addWheelName, removeWheelEntry, syncPlayersInWheel, resetRoom } from "../api/room-api";
import { activeRoomKey, activeRoomNamesInWheelList, getMissingPlayers, setPendingHostSpinToken } from "./room-state";

export interface GameModeStrategy {
  onSpinClick(direction: Direction): Promise<void>;
  onReset(): void;
  onWinnerModalClose(): void;
  getRoleLockedElements(): SpinElement[];
  addNameToWheel(rawName: string): Promise<void>;
  removeNameFromWheel(index: number): Promise<void>;
  removeWinnerFromWheel(index: number): Promise<void>;
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

  async removeNameFromWheel(): Promise<void> { }

  async removeWinnerFromWheel(index: number): Promise<void> {
    removeNameFromListByIndex(index);
    hideWinnerModal();
    resetWheelRotation();
  }

  async toggleAllPlayersInWheel(): Promise<void> { }

  canManagePlayers(): boolean {
    return false;
  }

  isHost(): boolean {
    return false;
  }

  getLeaveConfirmMessage(): string {
    return t('room.leaveConfirmGuest');
  }

  getLeaveResultMessage(success: boolean): string {
    return t(success ? 'room.left' : 'api.room.leaveFailed');
  }
}

async function handleRoomReset(closeWinnerModal: boolean): Promise<void> {
  if (!activeRoomKey) return;
  try {
    await resetRoom(activeRoomKey, closeWinnerModal);
  } catch (error) {
    console.error('[ROOM] Reset fehlgeschlagen:', error);
    showToast({ message: t('api.room.resetFailed'), type: 'error' });
  }
}

export class HostModeStrategy implements GameModeStrategy {
  async onSpinClick(direction: Direction): Promise<void> {
    if (!activeRoomKey) return;
    try {
      const { spinToken } = await spinRoom(activeRoomKey, direction);
      setPendingHostSpinToken(spinToken);
    } catch (error) {
      console.error('[ROOM] Spin fehlgeschlagen:', error);
      applyGameModeLock();
      showToast({ message: t('api.room.spinFailed'), type: 'error' });
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
      showToast({ message: t('names.maxItems', { max: MAX_ITEMS }), type: 'error' });
      return;
    }
    if (isNameInWheelList(existingNamesInWheelList, validation.value)) {
      showToast({ message: t('names.duplicate', { name: validation.value }), type: 'error' });
      return;
    }

    await addWheelName(activeRoomKey, validation.value);
    input.value = '';
  }

  async removeNameFromWheel(index: number): Promise<void> {
    if (!activeRoomKey) return;

    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    if (index < 0 || index >= existingNamesInWheelList.length) return;

    await removeWheelEntry(activeRoomKey, index);
  }

  async removeWinnerFromWheel(index: number): Promise<void> {
    await this.removeNameFromWheel(index);
    await handleRoomReset(true);
  }

  async toggleAllPlayersInWheel(players: string[]): Promise<void> {
    if (!activeRoomKey) return;

    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const missingPlayers = getMissingPlayers(players, existingNamesInWheelList);
    if (missingPlayers.length > 0 && existingNamesInWheelList.length + missingPlayers.length > MAX_ITEMS) {
      showToast({ message: t('names.maxItems', { max: MAX_ITEMS }), type: 'error' });
      return;
    }

    await syncPlayersInWheel(activeRoomKey, players);
  }

  canManagePlayers(): boolean {
    return true;
  }

  isHost(): boolean {
    return true;
  }

  getLeaveConfirmMessage(guestCount: number): string {
    if (guestCount > 0) {
      return t('room.leaveConfirmGuests', { count: guestCount });
    }
    return t('room.leaveConfirmHost');
  }

  getLeaveResultMessage(success: boolean): string {
    return t(success ? 'room.closed' : 'api.room.closeFailed');
  }
}

export class GuestModeStrategy implements GameModeStrategy {
  async onSpinClick(): Promise<void> { }

  onReset(): void { }

  onWinnerModalClose(): void {
    hideWinnerModal();
    resetWheelRotation();
  }

  getRoleLockedElements(): SpinElement[] {
    return [multiplierButton, resetBtn, spinBtn, input, addBtn, getRemoveBtn()];
  }

  async addNameToWheel(rawName: string): Promise<void> {
    addNameToList(rawName);
  }

  async removeNameFromWheel(): Promise<void> { }

  async removeWinnerFromWheel(): Promise<void> { }

  async toggleAllPlayersInWheel(): Promise<void> { }

  canManagePlayers(): boolean {
    return false;
  }

  isHost(): boolean {
    return false;
  }

  getLeaveConfirmMessage(): string {
    return t('room.leaveConfirmGuest');
  }

  getLeaveResultMessage(success: boolean): string {
    return t(success ? 'room.left' : 'api.room.leaveFailed');
  }
}

let currentMode: GameModeStrategy = new SoloModeStrategy();

export function getCurrentMode(): GameModeStrategy {
  return currentMode;
}

export function setCurrentMode(mode: GameModeStrategy): void {
  currentMode = mode;
}
