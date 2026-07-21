import { optionalElement } from "../shared/dom-helpers";
import { addBtn, input } from "../names/names-in-wheel-list";
import { isSpinning } from "../wheel/spin";
import { showToast } from "../shared/toast";
import { activeRoomKey, activeRoomPlayers, roomKeyDisplay } from "./room-state";
import { getCurrentMode } from "./game-mode-strategy";
import { playersList, bulkAddToWheelBtn } from "./room-players-sidebar";
import { executeCreateRoom, executeJoinRoom, executeLeaveRoom, backupNamesBeforeJoiningRoom } from "./room-orchestration";

export function initAddNameInput(): void {
  addBtn.addEventListener("click", async () => {
    await getCurrentMode().addNameToWheel(input.value);
  });

  input.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      await getCurrentMode().addNameToWheel(input.value);
    }
  });
}

let pendingRoomAction: (() => Promise<void>) | null = null;
const leaveRoomConfirmModal = optionalElement<HTMLDialogElement>("leave-room-confirm-modal");
const leaveRoomConfirmMessage = optionalElement<HTMLParagraphElement>("leave-room-confirm-message");

export function showSwitchRoomConfirm(message: string, action: () => Promise<void>): void {
  if (leaveRoomConfirmMessage) leaveRoomConfirmMessage.textContent = message;
  pendingRoomAction = action;
  leaveRoomConfirmModal?.showModal();
}

// true, wenn gerade gespinnt wird — zeigt dabei zugleich den Warn-Toast,
// der erklärt, warum die Raum-Aktion gerade nicht ausgeführt werden darf.
function isBlockedBySpinning(): boolean {
  if (!isSpinning()) return false;
  showToast({ message: 'Bitte warte, bis das Rad aufgehört hat zu drehen', type: 'error' });
  return true;
}

// Sichert die lokalen Solo-Namen und führt die Aktion entweder direkt aus
// oder holt vorher eine Bestätigung ein, falls schon ein anderer Raum aktiv ist.
function startRoomAction(confirmMessage: string, action: () => Promise<void>): void {
  backupNamesBeforeJoiningRoom();
  if (activeRoomKey) {
    showSwitchRoomConfirm(confirmMessage, action);
    return;
  }
  void action();
}

const createRoomBtn = optionalElement<HTMLButtonElement>("room-create-btn");
const roomKeyInput = optionalElement<HTMLInputElement>("room-key-input");
const joinRoomBtn = optionalElement<HTMLButtonElement>("room-join-btn");
const leaveRoomBtn = optionalElement<HTMLButtonElement>("room-leave-btn");
const copyRoomKeyBtn = optionalElement<HTMLButtonElement>("room-copy-key-btn");
const confirmLeaveRoomBtn = optionalElement<HTMLButtonElement>("leave-room-confirm-confirm-btn");
const cancelLeaveRoomBtn = optionalElement<HTMLButtonElement>("leave-room-confirm-cancel-btn");

export function initRoomButtons(): void {
  bulkAddToWheelBtn?.addEventListener('click', async () => {
    const players = Array.from(playersList?.querySelectorAll('.room__player-name') ?? [])
      .map((nameElement) => nameElement.textContent?.trim() ?? '');
    await getCurrentMode().toggleAllPlayersInWheel(players);
  });

  createRoomBtn?.addEventListener('click', () => {
    if (isBlockedBySpinning()) return;
    startRoomAction(
      `Du bist noch in Raum ${activeRoomKey}. Raum verlassen und neuen Raum erstellen?`,
      executeCreateRoom,
    );
  });

  joinRoomBtn?.addEventListener('click', () => {
    const roomKey = roomKeyInput?.value.trim().toUpperCase() ?? '';
    if (!roomKey) return;
    if (isBlockedBySpinning()) return;
    startRoomAction(
      `Du bist noch in Raum ${activeRoomKey}. Raum verlassen und Raum ${roomKey} beitreten?`,
      () => executeJoinRoom(roomKey),
    );
  });

  leaveRoomBtn?.addEventListener('click', () => {
    if (isBlockedBySpinning()) return;
    if (leaveRoomConfirmMessage) {
      const guestCount = activeRoomPlayers.length - 1;
      leaveRoomConfirmMessage.textContent = getCurrentMode().getLeaveConfirmMessage(guestCount);
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
