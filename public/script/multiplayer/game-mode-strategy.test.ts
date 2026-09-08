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
import type { GameModeStrategy } from './game-mode-strategy';
import { spinRoom, addWheelName, removeWheelEntry, syncPlayersInWheel, resetRoom } from '../api/room-api';
import { input } from '../names/names-in-wheel-list';
import { setActiveRoomKey, setActiveRoomNamesInWheelList } from './room-state';

describe('HostModeStrategy', () => {
  let strategy: HostModeStrategy;

  beforeEach(() => {
    strategy = new HostModeStrategy();
    setActiveRoomKey(null);
    setActiveRoomNamesInWheelList([]);
  });

  describe('ohne aktiven Room-Key', () => {
    it('onSpinClick macht nichts', async () => {
      await strategy.onSpinClick('left');

      expect(spinRoom).not.toHaveBeenCalled();
    });

    it('addNameToWheel macht nichts', async () => {
      await strategy.addNameToWheel('Peter');

      expect(addWheelName).not.toHaveBeenCalled();
    });

    it('removeNameFromWheel macht nichts', async () => {
      await strategy.removeNameFromWheel(0);

      expect(removeWheelEntry).not.toHaveBeenCalled();
    });

    it('toggleAllPlayersInWheel macht nichts', async () => {
      await strategy.toggleAllPlayersInWheel(['Peter']);

      expect(syncPlayersInWheel).not.toHaveBeenCalled();
    });

    it('onReset ruft resetRoom nicht auf', async () => {
      strategy.onReset();
      await Promise.resolve();

      expect(resetRoom).not.toHaveBeenCalled();
    });

    it('onWinnerModalClose ruft resetRoom nicht auf', async () => {
      strategy.onWinnerModalClose();
      await Promise.resolve();

      expect(resetRoom).not.toHaveBeenCalled();
    });

    it('removeWinnerFromWheel ruft weder removeWheelEntry noch resetRoom auf', async () => {
      await strategy.removeWinnerFromWheel(0);

      expect(removeWheelEntry).not.toHaveBeenCalled();
      expect(resetRoom).not.toHaveBeenCalled();
    });
  });

  describe('mit aktivem Room-Key', () => {
    const roomKey = 'ROOM123';

    beforeEach(() => {
      setActiveRoomKey(roomKey);
    });

    it('onSpinClick ruft spinRoom mit dem Room-Key auf', async () => {
      vi.mocked(spinRoom).mockResolvedValue({ spinToken: 'token-1', ranNum: 1, winnerName: 'Peter' });

      await strategy.onSpinClick('left');

      expect(spinRoom).toHaveBeenCalledWith(roomKey, 'left');
    });

    it('addNameToWheel ruft addWheelName mit dem Room-Key auf und leert das Input-Feld', async () => {
      await strategy.addNameToWheel('Peter');

      expect(addWheelName).toHaveBeenCalledWith(roomKey, 'Peter');
      expect(input.value).toBe('');
    });

    it('removeNameFromWheel ruft removeWheelEntry mit dem Room-Key auf', async () => {
      setActiveRoomNamesInWheelList(['Peter', 'Lois']);

      await strategy.removeNameFromWheel(0);

      expect(removeWheelEntry).toHaveBeenCalledWith(roomKey, 0);
    });

    it('toggleAllPlayersInWheel ruft syncPlayersInWheel mit dem Room-Key auf', async () => {
      await strategy.toggleAllPlayersInWheel(['Peter']);

      expect(syncPlayersInWheel).toHaveBeenCalledWith(roomKey, ['Peter']);
    });

    it('onReset ruft resetRoom mit dem Room-Key auf (closeWinnerModal=false)', async () => {
      strategy.onReset();
      await Promise.resolve();

      expect(resetRoom).toHaveBeenCalledWith(roomKey, false);
    });

    it('onWinnerModalClose ruft resetRoom mit dem Room-Key auf (closeWinnerModal=true)', async () => {
      strategy.onWinnerModalClose();
      await Promise.resolve();

      expect(resetRoom).toHaveBeenCalledWith(roomKey, true);
    });

    it('removeWinnerFromWheel entfernt den Namen und triggert einen Reset', async () => {
      setActiveRoomNamesInWheelList(['Peter']);

      await strategy.removeWinnerFromWheel(0);

      expect(removeWheelEntry).toHaveBeenCalledWith(roomKey, 0);
      expect(resetRoom).toHaveBeenCalledWith(roomKey, true);
    });
  });
});

describe('RoomKeyGuardedHostModeStrategy', () => {
  const createHostStrategyStub = (): GameModeStrategy => ({
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

  let hostStrategyStub: GameModeStrategy;
  let guardedStrategy: RoomKeyGuardedHostModeStrategy;

  beforeEach(() => {
    hostStrategyStub = createHostStrategyStub();
    guardedStrategy = new RoomKeyGuardedHostModeStrategy(hostStrategyStub as HostModeStrategy);
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
    beforeEach(() => {
      setActiveRoomKey('ROOM123');
    });

    it('leitet alle room-abhängigen Methoden unverändert an die echte Strategie weiter', async () => {
      await guardedStrategy.onSpinClick('left');
      guardedStrategy.onReset();
      guardedStrategy.onWinnerModalClose();
      await guardedStrategy.addNameToWheel('Peter');
      await guardedStrategy.removeNameFromWheel(0);
      await guardedStrategy.removeWinnerFromWheel(0);
      await guardedStrategy.toggleAllPlayersInWheel(['Peter']);

      expect(hostStrategyStub.onSpinClick).toHaveBeenCalledWith('left');
      expect(hostStrategyStub.onReset).toHaveBeenCalled();
      expect(hostStrategyStub.onWinnerModalClose).toHaveBeenCalled();
      expect(hostStrategyStub.addNameToWheel).toHaveBeenCalledWith('Peter');
      expect(hostStrategyStub.removeNameFromWheel).toHaveBeenCalledWith(0);
      expect(hostStrategyStub.removeWinnerFromWheel).toHaveBeenCalledWith(0);
      expect(hostStrategyStub.toggleAllPlayersInWheel).toHaveBeenCalledWith(['Peter']);
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
