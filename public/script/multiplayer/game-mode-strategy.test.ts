import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../wheel/spin', () => ({
  spinWheelWithRandomSteps: vi.fn(),
  applyGameModeLock: vi.fn(),
  resetWheelRotation: vi.fn(),
  spinBtn: {},
  resetBtn: {},
}));

vi.mock('../wheel/multiplier', () => ({
  multiplierButton: {},
}));

vi.mock('../wheel/winner', () => ({
  hideWinnerModal: vi.fn(),
}));

vi.mock('../names/names-in-wheel-list', () => ({
  addNameToList: vi.fn(),
  addBtn: {},
  input: { value: '' },
  getRemoveBtn: vi.fn(() => ({})),
  removeNameFromListByIndex: vi.fn(),
}));

vi.mock('../names/name-input-validation', () => ({
  getNameValidationMessage: vi.fn((code: string) => code),
}));

vi.mock('../shared/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../app/i18n', () => ({
  t: vi.fn((key: string) => key),
}));

vi.mock('../api/room-api', () => ({
  spinRoom: vi.fn(),
  addWheelName: vi.fn(),
  removeWheelEntry: vi.fn(),
  syncPlayersInWheel: vi.fn(),
  resetRoom: vi.fn(),
}));

vi.mock('./room-state', () => {
  const state: { activeRoomKey: string | null; activeRoomNamesInWheelList: string[] } = {
    activeRoomKey: null,
    activeRoomNamesInWheelList: [],
  };
  return {
    get activeRoomKey() { return state.activeRoomKey; },
    get activeRoomNamesInWheelList() { return state.activeRoomNamesInWheelList; },
    setActiveRoomKey: (roomKey: string | null) => { state.activeRoomKey = roomKey; },
    setActiveRoomNamesInWheelList: (names: string[]) => { state.activeRoomNamesInWheelList = names; },
    getMissingPlayers: vi.fn((players: string[], namesInWheelList: string[]) =>
      players.filter((player) => !namesInWheelList.includes(player))
    ),
    setPendingHostSpinToken: vi.fn(),
    withActiveRoomKey: <Args extends unknown[], Result>(
      action: (roomKey: string, ...args: Args) => Result
    ) => (...args: Args): Result | undefined => {
      if (!state.activeRoomKey) return undefined;
      return action(state.activeRoomKey, ...args);
    },
  };
});

import { HostModeStrategy, RoomKeyGuardedHostModeStrategy } from './game-mode-strategy';
import type { RoomKeyDependentHostActions } from './game-mode-strategy';
import type { SpinElement } from '../wheel/spin';
import { spinRoom, addWheelName, removeWheelEntry, syncPlayersInWheel, resetRoom } from '../api/room-api';
import { input } from '../names/names-in-wheel-list';
import { setActiveRoomKey, setActiveRoomNamesInWheelList } from './room-state';

describe('HostModeStrategy', () => {
  let strategy: HostModeStrategy;
  const roomKey = 'ROOM123';

  beforeEach(() => {
    strategy = new HostModeStrategy();
    setActiveRoomNamesInWheelList([]);
  });

  it('onSpinClick ruft spinRoom mit dem übergebenen Room-Key auf', async () => {
    vi.mocked(spinRoom).mockResolvedValue({ spinToken: 'token-1', ranNum: 1, winnerName: 'Peter' });

    await strategy.onSpinClick('left', roomKey);

    expect(spinRoom).toHaveBeenCalledWith(roomKey, 'left');
  });

  it('addNameToWheel ruft addWheelName mit dem übergebenen Room-Key auf und leert das Input-Feld', async () => {
    await strategy.addNameToWheel('Peter', roomKey);

    expect(addWheelName).toHaveBeenCalledWith(roomKey, 'Peter');
    expect(input.value).toBe('');
  });

  it('removeNameFromWheel ruft removeWheelEntry mit dem übergebenen Room-Key auf', async () => {
    setActiveRoomNamesInWheelList(['Peter', 'Lois']);

    await strategy.removeNameFromWheel(0, roomKey);

    expect(removeWheelEntry).toHaveBeenCalledWith(roomKey, 0);
  });

  it('toggleAllPlayersInWheel ruft syncPlayersInWheel mit dem übergebenen Room-Key auf', async () => {
    await strategy.toggleAllPlayersInWheel(['Peter'], roomKey);

    expect(syncPlayersInWheel).toHaveBeenCalledWith(roomKey, ['Peter']);
  });

  it('onReset ruft resetRoom mit dem übergebenen Room-Key auf (closeWinnerModal=false)', async () => {
    strategy.onReset(roomKey);
    await Promise.resolve();

    expect(resetRoom).toHaveBeenCalledWith(roomKey, false);
  });

  it('onWinnerModalClose ruft resetRoom mit dem übergebenen Room-Key auf (closeWinnerModal=true)', async () => {
    strategy.onWinnerModalClose(roomKey);
    await Promise.resolve();

    expect(resetRoom).toHaveBeenCalledWith(roomKey, true);
  });

  it('removeWinnerFromWheel entfernt den Namen und triggert einen Reset', async () => {
    setActiveRoomNamesInWheelList(['Peter']);

    await strategy.removeWinnerFromWheel(0, roomKey);

    expect(removeWheelEntry).toHaveBeenCalledWith(roomKey, 0);
    expect(resetRoom).toHaveBeenCalledWith(roomKey, true);
  });
});

type HostStrategyStub = RoomKeyDependentHostActions & {
  getRoleLockedElements: () => SpinElement[];
  canManagePlayers: () => boolean;
  isHost: () => boolean;
  getLeaveConfirmMessage: (guestCount: number) => string;
  getLeaveResultMessage: (success: boolean) => string;
};

describe('RoomKeyGuardedHostModeStrategy', () => {
  const createHostStrategyStub = (): HostStrategyStub => ({
    onSpinClick: vi.fn(async () => { }),
    onReset: vi.fn(),
    onWinnerModalClose: vi.fn(),
    getRoleLockedElements: vi.fn(() => []),
    addNameToWheel: vi.fn(async () => { }),
    removeNameFromWheel: vi.fn(async () => { }),
    removeWinnerFromWheel: vi.fn(async () => { }),
    toggleAllPlayersInWheel: vi.fn(async () => { }),
    canManagePlayers: vi.fn(() => true),
    isHost: vi.fn(() => true),
    getLeaveConfirmMessage: vi.fn(() => 'confirm'),
    getLeaveResultMessage: vi.fn(() => 'result'),
  });

  let hostStrategyStub: HostStrategyStub;
  let guardedStrategy: RoomKeyGuardedHostModeStrategy;

  beforeEach(() => {
    hostStrategyStub = createHostStrategyStub();
    guardedStrategy = new RoomKeyGuardedHostModeStrategy(hostStrategyStub as unknown as HostModeStrategy);
    setActiveRoomKey(null);
  });

  describe('ohne aktiven Room-Key', () => {
    it('leitet keine der room-abhängigen Methoden an die echte Strategie weiter', async () => {
      await guardedStrategy.onSpinClick('left');
      guardedStrategy.onReset();
      guardedStrategy.onWinnerModalClose();
      await guardedStrategy.addNameToWheel('Peter');
      await guardedStrategy.removeNameFromWheel(0);
      await guardedStrategy.removeWinnerFromWheel(0);
      await guardedStrategy.toggleAllPlayersInWheel(['Peter']);

      expect(hostStrategyStub.onSpinClick).not.toHaveBeenCalled();
      expect(hostStrategyStub.onReset).not.toHaveBeenCalled();
      expect(hostStrategyStub.onWinnerModalClose).not.toHaveBeenCalled();
      expect(hostStrategyStub.addNameToWheel).not.toHaveBeenCalled();
      expect(hostStrategyStub.removeNameFromWheel).not.toHaveBeenCalled();
      expect(hostStrategyStub.removeWinnerFromWheel).not.toHaveBeenCalled();
      expect(hostStrategyStub.toggleAllPlayersInWheel).not.toHaveBeenCalled();
    });
  });

  describe('mit aktivem Room-Key', () => {
    const roomKey = 'ROOM123';

    beforeEach(() => {
      setActiveRoomKey(roomKey);
    });

    it('leitet alle room-abhängigen Methoden inkl. Room-Key an die echte Strategie weiter', async () => {
      await guardedStrategy.onSpinClick('left');
      guardedStrategy.onReset();
      guardedStrategy.onWinnerModalClose();
      await guardedStrategy.addNameToWheel('Peter');
      await guardedStrategy.removeNameFromWheel(0);
      await guardedStrategy.removeWinnerFromWheel(0);
      await guardedStrategy.toggleAllPlayersInWheel(['Peter']);

      expect(hostStrategyStub.onSpinClick).toHaveBeenCalledWith('left', roomKey);
      expect(hostStrategyStub.onReset).toHaveBeenCalledWith(roomKey);
      expect(hostStrategyStub.onWinnerModalClose).toHaveBeenCalledWith(roomKey);
      expect(hostStrategyStub.addNameToWheel).toHaveBeenCalledWith('Peter', roomKey);
      expect(hostStrategyStub.removeNameFromWheel).toHaveBeenCalledWith(0, roomKey);
      expect(hostStrategyStub.removeWinnerFromWheel).toHaveBeenCalledWith(0, roomKey);
      expect(hostStrategyStub.toggleAllPlayersInWheel).toHaveBeenCalledWith(['Peter'], roomKey);
    });
  });

  it('leitet die room-unabhängigen Methoden immer weiter, unabhängig vom Room-Key', () => {
    expect(guardedStrategy.getRoleLockedElements()).toEqual([]);
    expect(guardedStrategy.canManagePlayers()).toBe(true);
    expect(guardedStrategy.isHost()).toBe(true);
    expect(guardedStrategy.getLeaveConfirmMessage(2)).toBe('confirm');
    expect(guardedStrategy.getLeaveResultMessage(true)).toBe('result');

    expect(hostStrategyStub.getRoleLockedElements).toHaveBeenCalled();
    expect(hostStrategyStub.canManagePlayers).toHaveBeenCalled();
    expect(hostStrategyStub.isHost).toHaveBeenCalled();
    expect(hostStrategyStub.getLeaveConfirmMessage).toHaveBeenCalledWith(2);
    expect(hostStrategyStub.getLeaveResultMessage).toHaveBeenCalledWith(true);
  });
});
