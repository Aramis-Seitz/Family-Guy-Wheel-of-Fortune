import { optionalElement } from "../shared/dom-helpers";
import { getNamesInWheelList, addBtn, input } from "../names/names-in-wheel-list";
import { applyDisabledStyle } from "../wheel/spin";
import { activeRoomHostName, activeRoomNamesInWheelList, getMissingPlayers, isMultiplayerActive } from "./room-state";
import { getCurrentMode } from "./game-mode-strategy";
import { t } from "../app/i18n";

export const playersList = optionalElement<HTMLUListElement>("room-players-list");

export function renderPlayersSidebar(players: string[]): void {
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
      hostTag.textContent = t('room.host');
      hostTag.className = 'room__host-tag';
      playerEntry.appendChild(hostTag);
    }

    if (getCurrentMode().canManagePlayers()) {
      const togglePlayerInWheelListBtn = document.createElement('button');
      togglePlayerInWheelListBtn.type = 'button';
      togglePlayerInWheelListBtn.className = 'room__player-toggle-btn';
      const isPlayerInWheelList = (activeRoomNamesInWheelList ?? []).includes(name);
      togglePlayerInWheelListBtn.textContent = isPlayerInWheelList ? '−' : '+';
      if (isPlayerInWheelList) togglePlayerInWheelListBtn.classList.add('room__player-toggle-btn--added');
      togglePlayerInWheelListBtn.title = t(
        isPlayerInWheelList ? 'room.removeFromWheel' : 'room.addToWheel',
        { name },
      );

      togglePlayerInWheelListBtn.addEventListener('click', async () => {
        togglePlayerInWheelListBtn.disabled = true;
        try {
          const index = (activeRoomNamesInWheelList ?? []).indexOf(name);
          if (index >= 0) {
            await getCurrentMode().removeNameFromWheel(index);
          } else {
            await getCurrentMode().addNameToWheel(name);
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

export function getPlayerToggleButtons(): NodeListOf<HTMLButtonElement> {
  return document.querySelectorAll<HTMLButtonElement>(".room__player-toggle-btn");
}

export const bulkAddToWheelBtn = optionalElement<HTMLButtonElement>("room-bulk-add-btn");

export function setHostControlsVisibility(): void {
  const host: boolean = getCurrentMode().isHost();
  const guestInRoom = isMultiplayerActive() && !host;

  // Host-only-Controls werden für Gäste vollständig aus dem sichtbaren und
  // fokussierbaren Bereich genommen. Die serverseitige Host-Prüfung bleibt
  // dabei die verbindliche Sicherheitsgrenze.
  [
    "spin-left-btn",
    "spin-right-btn",
    "reset-btn",
    "name-sidebar-add-row",
    "name-centered-input",
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.hidden = guestInRoom;
      element.classList.toggle('hidden', guestInRoom);
    }
  });

  if (bulkAddToWheelBtn) {
    bulkAddToWheelBtn.classList.toggle('hidden', !host);
  }

  [input, addBtn].forEach((element) => {
    if (element) applyDisabledStyle(element, guestInRoom);
  });
}

export const wheelEmptyHint = optionalElement<HTMLDivElement>("wheel-empty-hint");

export function updateWheelEmptyState(): void {
  if (!wheelEmptyHint) return;
  wheelEmptyHint.classList.toggle('hidden', getNamesInWheelList().length > 0);
}

export function updateBulkButtonState(players: string[]): void {
  if (!bulkAddToWheelBtn) return;
  const anyMissing = getMissingPlayers(players, activeRoomNamesInWheelList ?? []).length > 0;
  if (anyMissing) {
    bulkAddToWheelBtn.textContent = t('room.bulkAdd');
    bulkAddToWheelBtn.classList.remove('room__btn--remove');
  } else {
    bulkAddToWheelBtn.textContent = t('room.bulkRemove');
    bulkAddToWheelBtn.classList.add('room__btn--remove');
  }
}
