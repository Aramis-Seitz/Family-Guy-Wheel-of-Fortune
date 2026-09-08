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
  };
});

import { HostModeStrategy } from './game-mode-strategy';
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
