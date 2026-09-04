import { store, newId } from "../mock/store";
import type * as Real from "./room-repository.real";


function notFoundError() {
    return { message: "Row not found", code: "PGRST116" };
}

export const getActiveRoomForUser: typeof Real.getActiveRoomForUser = async (userId) => {
    const room = store.rooms.find((r) => r.players.some((p) => p.id === userId));
    return room ?? null;
};

export const insertRoom: typeof Real.insertRoom = async (roomKey, hostId, hostUsername, hostSuffix) => {
    store.rooms.push({
        id: newId(),
        room_key: roomKey,
        host_id: hostId,
        players: [{ id: hostId, username: hostUsername, suffix: hostSuffix }],
        names_in_wheel: [],
        last_spin: null,
        spun_at: null,
        multiplier: 1,
        spin_direction: null,
        spin_winner: null,
        wheel_reset_at: null,
        winner_modal_close_at: null,
        created_at: new Date().toISOString(),
    });
};

export const getRoomByKey: typeof Real.getRoomByKey = async (roomKey) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    return room ?? null;
};

export const updateRoomPlayers: typeof Real.updateRoomPlayers = async (roomKey, players) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (!room) throw notFoundError();
    room.players = players;
    return room.players;
};

export const removePlayerFromRoom: typeof Real.removePlayerFromRoom = async (roomKey, userId) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (!room) throw notFoundError();
    room.players = room.players.filter((p) => p.id !== userId);
    return room.players;
};

export const updateRoomNames: typeof Real.updateRoomNames = async (roomKey, names) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (!room) throw notFoundError();
    room.names_in_wheel = names;
    return room.names_in_wheel;
};

export const clearRoomPlayers: typeof Real.clearRoomPlayers = async (roomKey) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (room) room.players = [];
};

export const updateRoomSpin: typeof Real.updateRoomSpin = async (roomKey, lastSpin, spunAt, direction, winner) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (!room) return;
    room.last_spin = lastSpin;
    room.spun_at = spunAt;
    room.spin_direction = direction;
    room.spin_winner = winner;
};

export const updateRoomMultiplier: typeof Real.updateRoomMultiplier = async (roomKey, multiplier) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (room) room.multiplier = multiplier;
};

export const updateRoomReset: typeof Real.updateRoomReset = async (roomKey, closeWinnerModal) => {
    const room = store.rooms.find((r) => r.room_key === roomKey);
    if (!room) return;
    const now = new Date().toISOString();
    room.wheel_reset_at = now;
    if (closeWinnerModal) room.winner_modal_close_at = now;
};

export const insertSpinToken: typeof Real.insertSpinToken = async (token, userId, namesInWheel, winnerIndex) => {
    store.spin_tokens.push({ token, user_id: userId, used: false, names_in_wheel: namesInWheel, winner_index: winnerIndex, created_at: new Date().toISOString() });
    return token;
};

export const findAwardableSpin: typeof Real.findAwardableSpin = async (token, userId) => {
    const spinToken = store.spin_tokens.find((t) => t.token === token && t.user_id === userId && !t.used);
    if (!spinToken) return null;
    return { namesInWheel: spinToken.names_in_wheel ?? [], winnerIndex: spinToken.winner_index };
};

export const markSpinTokenUsed: typeof Real.markSpinTokenUsed = async (token) => {
    const spinToken = store.spin_tokens.find((t) => t.token === token);
    if (spinToken) spinToken.used = true;
};

export const deleteRoomByKey: typeof Real.deleteRoomByKey = async (roomKey) => {
    store.rooms = store.rooms.filter((r) => r.room_key !== roomKey);
};
