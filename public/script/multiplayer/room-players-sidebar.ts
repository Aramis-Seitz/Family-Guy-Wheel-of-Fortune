import { optionalElement } from "../shared/dom-helpers";
import { getNamesInWheelList, addBtn, input } from "../names/names-in-wheel-list";
import { activeRoomHostName, activeRoomNamesInWheelList, getMissingPlayers } from "./room-state";
import { getCurrentMode } from "./game-mode-strategy";

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
      hostTag.textContent = 'Host';
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
      togglePlayerInWheelListBtn.title = isPlayerInWheelList ? `Vom Rad entfernen: ${name}` : `Zu Rad hinzufügen: ${name}`;

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

export const bulkAddToWheelBtn = optionalElement<HTMLButtonElement>("room-bulk-add-btn");

export function setHostControlsVisibility(host: boolean): void {
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

export function updateWheelEmptyState(): void {
  if (!wheelEmptyHint) return;
  wheelEmptyHint.classList.toggle('hidden', getNamesInWheelList().length > 0);
}

export function updateBulkButtonState(players: string[]): void {
  if (!bulkAddToWheelBtn) return;
  const anyMissing = getMissingPlayers(players, activeRoomNamesInWheelList ?? []).length > 0;
  if (anyMissing) {
    bulkAddToWheelBtn.textContent = 'Alle zum Rad hinzufügen';
    bulkAddToWheelBtn.classList.remove('room__btn--remove');
  } else {
    bulkAddToWheelBtn.textContent = 'Alle vom Rad entfernen';
    bulkAddToWheelBtn.classList.add('room__btn--remove');
  }
}
