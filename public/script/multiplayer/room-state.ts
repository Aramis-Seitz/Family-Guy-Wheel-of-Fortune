import { optionalElement } from "../shared/dom-helpers";

// Reine Datenhaltung für den aktuell aktiven Raum. Dieses Modul kennt bewusst
// weder Realtime-Sync noch GameModeStrategy noch Sidebar-Rendering — es hält
// nur die Werte und stellt Setter bereit. Die eigentliche Koordination (wer
// setzt wann was, welche Kaskade an Folge-Updates das auslöst) übernimmt
// ausschließlich room-orchestration.ts.

export let activeRoomKey: string | null = null;
export let activeRoomNamesInWheelList: string[] = [];
export let activeRoomPlayers: string[] = [];
export let activeRoomHostName = '';

export const roomKeyDisplay = optionalElement<HTMLSpanElement>("room-key-display");
export const roomInfo = optionalElement<HTMLDivElement>("room-info");

export function setActiveRoomKey(roomKey: string | null): void {
  activeRoomKey = roomKey;
}

export function setActiveRoomNamesInWheelList(names: string[]): void {
  activeRoomNamesInWheelList = names;
}

export function setActiveRoomPlayers(players: string[]): void {
  activeRoomPlayers = players;
}

export function setActiveRoomHostName(hostName: string): void {
  activeRoomHostName = hostName;
}

export function isMultiplayerActive(): boolean {
  return !!activeRoomKey;
}
