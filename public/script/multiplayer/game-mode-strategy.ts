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
import { activeRoomNamesInWheelList, getMissingPlayers, setPendingHostSpinToken, withActiveRoomKey } from "./room-state";

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

export interface RoomKeyDependentHostActions {
  onSpinClick(direction: Direction, roomKey: string): Promise<void>;
  onReset(roomKey: string): void;
  onWinnerModalClose(roomKey: string): void;
  addNameToWheel(rawName: string, roomKey: string): Promise<void>;
  removeNameFromWheel(index: number, roomKey: string): Promise<void>;
  removeWinnerFromWheel(index: number, roomKey: string): Promise<void>;
  toggleAllPlayersInWheel(players: string[], roomKey: string): Promise<void>;
}

type RoomKeyIndependentHostActions = Pick<
  GameModeStrategy,
  "getRoleLockedElements" | "canManagePlayers" | "isHost" | "getLeaveConfirmMessage" | "getLeaveResultMessage"
>;

type HostStrategyContract = RoomKeyDependentHostActions & RoomKeyIndependentHostActions;

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

async function handleRoomReset(roomKey: string, closeWinnerModal: boolean): Promise<void> {
  try {
    await resetRoom(roomKey, closeWinnerModal);
  } catch (error) {
    console.error('[ROOM] Reset fehlgeschlagen:', error);
    showToast({ message: t('api.room.resetFailed'), type: 'error' });
  }
}

export class HostModeStrategy implements HostStrategyContract {
  async onSpinClick(direction: Direction, roomKey: string): Promise<void> {
    try {
      const { spinToken } = await spinRoom(roomKey, direction);
      setPendingHostSpinToken(spinToken);
    } catch (error) {
      console.error('[ROOM] Spin fehlgeschlagen:', error);
      applyGameModeLock();
      showToast({ message: t('api.room.spinFailed'), type: 'error' });
    }
  }

  onReset(roomKey: string): void {
    void handleRoomReset(roomKey, false);
  }

  onWinnerModalClose(roomKey: string): void {
    void handleRoomReset(roomKey, true);
  }

  getRoleLockedElements(): SpinElement[] {
    return [];
  }

  async addNameToWheel(rawName: string, roomKey: string): Promise<void> {
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

    await addWheelName(roomKey, validation.value);
    input.value = '';
  }

  async removeNameFromWheel(index: number, roomKey: string): Promise<void> {
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    if (index < 0 || index >= existingNamesInWheelList.length) return;

    await removeWheelEntry(roomKey, index);
  }

  async removeWinnerFromWheel(index: number, roomKey: string): Promise<void> {
    await this.removeNameFromWheel(index, roomKey);
    await handleRoomReset(roomKey, true);
  }

  async toggleAllPlayersInWheel(players: string[], roomKey: string): Promise<void> {
    const existingNamesInWheelList = activeRoomNamesInWheelList ?? [];
    const missingPlayers = getMissingPlayers(players, existingNamesInWheelList);
    if (missingPlayers.length > 0 && existingNamesInWheelList.length + missingPlayers.length > MAX_ITEMS) {
      showToast({ message: t('names.maxItems', { max: MAX_ITEMS }), type: 'error' });
      return;
    }

    await syncPlayersInWheel(roomKey, players);
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

export class RoomKeyGuardedHostModeStrategy implements GameModeStrategy {
  constructor(private readonly hostStrategy: HostStrategyContract) { }

  async onSpinClick(direction: Direction): Promise<void> {
    await withActiveRoomKey((roomKey) => this.hostStrategy.onSpinClick(direction, roomKey))();
  }

  onReset(): void {
    withActiveRoomKey((roomKey) => this.hostStrategy.onReset(roomKey))();
  }

  onWinnerModalClose(): void {
    withActiveRoomKey((roomKey) => this.hostStrategy.onWinnerModalClose(roomKey))();
  }

  getRoleLockedElements(): SpinElement[] {
    return this.hostStrategy.getRoleLockedElements();
  }

  async addNameToWheel(rawName: string): Promise<void> {
    await withActiveRoomKey((roomKey) => this.hostStrategy.addNameToWheel(rawName, roomKey))();
  }

  async removeNameFromWheel(index: number): Promise<void> {
    await withActiveRoomKey((roomKey) => this.hostStrategy.removeNameFromWheel(index, roomKey))();
  }

  async removeWinnerFromWheel(index: number): Promise<void> {
    await withActiveRoomKey((roomKey) => this.hostStrategy.removeWinnerFromWheel(index, roomKey))();
  }

  async toggleAllPlayersInWheel(players: string[]): Promise<void> {
    await withActiveRoomKey((roomKey) => this.hostStrategy.toggleAllPlayersInWheel(players, roomKey))();
  }

  canManagePlayers(): boolean {
    return this.hostStrategy.canManagePlayers();
  }

  isHost(): boolean {
    return this.hostStrategy.isHost();
  }

  getLeaveConfirmMessage(guestCount: number): string {
    return this.hostStrategy.getLeaveConfirmMessage(guestCount);
  }

  getLeaveResultMessage(success: boolean): string {
    return this.hostStrategy.getLeaveResultMessage(success);
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
