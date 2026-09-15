import { optionalElement } from "../shared/dom-helpers";
import { isNameInWheelList } from "../names/names-in-wheel-list-state";

export let activeRoomKey: string | null = null;
export let activeRoomNamesInWheelList: string[] = [];
export let activeRoomPlayerNamesInWheelList: string[] = [];
export let activeRoomPlayers: string[] = [];
export let activeRoomHostName = '';
let pendingHostSpinToken = '';

export const roomKeyDisplay = optionalElement<HTMLSpanElement>("room-key-display");
export const roomInfo = optionalElement<HTMLDivElement>("room-info");

export function setActiveRoomKey(roomKey: string | null): void {
  activeRoomKey = roomKey;
}

export function setActiveRoomNamesInWheelList(names: string[]): void {
  activeRoomNamesInWheelList = names;
}

export function setActiveRoomPlayerNamesInWheelList(names: string[]): void {
  activeRoomPlayerNamesInWheelList = names;
}

export function setActiveRoomPlayers(players: string[]): void {
  activeRoomPlayers = players;
}

export function setActiveRoomHostName(hostName: string): void {
  activeRoomHostName = hostName;
}

export function setPendingHostSpinToken(token: string): void {
  pendingHostSpinToken = token;
}

export function consumePendingHostSpinToken(): string {
  const token = pendingHostSpinToken;
  pendingHostSpinToken = '';
  return token;
}

export function isMultiplayerActive(): boolean {
  return !!activeRoomKey;
}

export function getMissingPlayers(players: string[], namesInWheelList: string[]): string[] {
  return players.filter((player) => !isNameInWheelList(namesInWheelList, player));
}

export function withActiveRoomKey<Args extends unknown[], Result>(
  action: (roomKey: string, ...args: Args) => Result
): (...args: Args) => Result | undefined {
  return (...args: Args): Result | undefined => {
    if (!activeRoomKey) return undefined;
    return action(activeRoomKey, ...args);
  };
}
