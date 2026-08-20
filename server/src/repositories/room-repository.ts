import * as real from "./room-repository.real";
import * as mock from "./room-repository.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const impl = USE_MOCK ? mock : real;

export const getActiveRoomForUser = impl.getActiveRoomForUser;
export const insertRoom = impl.insertRoom;
export const getRoomByKey = impl.getRoomByKey;
export const updateRoomPlayers = impl.updateRoomPlayers;
export const removePlayerFromRoom = impl.removePlayerFromRoom;
export const updateRoomNames = impl.updateRoomNames;
export const clearRoomPlayers = impl.clearRoomPlayers;
export const updateRoomSpin = impl.updateRoomSpin;
export const updateRoomMultiplier = impl.updateRoomMultiplier;
export const updateRoomReset = impl.updateRoomReset;
export const insertSpinToken = impl.insertSpinToken;
export const findSpinTokenNamesInWheel = impl.findSpinTokenNamesInWheel;
export const markSpinTokenUsed = impl.markSpinTokenUsed;
export const deleteRoomByKey = impl.deleteRoomByKey;

export type { RoomPlayer, RoomData, NameInWheel } from "./room-repository.shared";
