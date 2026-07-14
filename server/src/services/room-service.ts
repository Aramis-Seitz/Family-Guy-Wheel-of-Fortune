import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { getProfileByUserId } from "../repositories/profile-repository";
import {
    insertRoom,
    getRoomByKey,
    getActiveRoomForUser,
    updateRoomPlayers,
    updateRoomNames,
    clearRoomPlayers,
    deleteRoomByKey,
    removePlayerFromRoom,
    updateRoomSpin,
    updateRoomMultiplier,
    updateRoomReset,
    insertSpinToken,
    type RoomPlayer,
} from "../repositories/room-repository";
import { AppError } from "../lib/errors";
import type { CreateRoomResponseBody, JoinRoomResponseBody, SpinRandomResponseBody } from "shared";

function generateRoomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(6);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function createRoom(userId: string): Promise<CreateRoomResponseBody> {
    const existingRoom = await getActiveRoomForUser(userId);
    if (existingRoom) {
        await leaveRoom(userId, existingRoom.room_key);
    }

    const profile = await getProfileByUserId(userId);
    const hostUsername = profile?.username ?? userId;
    const roomKey = generateRoomKey();
    await insertRoom(roomKey, userId, hostUsername);
    return { roomKey, players: [hostUsername], names: [] };
}

function toUsernames(players: RoomPlayer[]): string[] {
    return players.map((p) => p.username);
}

export async function joinRoom(userId: string, roomKey: string): Promise<JoinRoomResponseBody> {
    const existingRoom = await getActiveRoomForUser(userId);
    if (existingRoom && existingRoom.room_key !== roomKey) {
        await leaveRoom(userId, existingRoom.room_key);
    }

    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    const profile = await getProfileByUserId(userId);
    const username = profile?.username ?? userId;
    const currentPlayers = room.players ?? [];
    const updatedPlayers = currentPlayers.some((p) => p.id === userId)
        ? currentPlayers
        : [...currentPlayers, { id: userId, username }];

    const players = await updateRoomPlayers(roomKey, updatedPlayers);
    const hostPlayer = room.players.find((p) => p.id === room.host_id);
    const hostName = hostPlayer?.username ?? (players[0]?.username ?? '');
    const multiplier = room.multiplier ?? 1;
    const names = room.names_in_wheel ?? [];

    return { players: toUsernames(players), multiplier, names, hostName };
}

export async function leaveRoom(userId: string, roomKey: string): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    if (room.host_id === userId) {
        // Host verlässt -> Room schließen
        // Erst leeren, damit verbundene Gäste das Realtime-"Room geschlossen"-Signal erhalten,
        // dann den Datensatz löschen, damit der roomKey nicht mehr joinbar bleibt.
        await clearRoomPlayers(roomKey);
        await deleteRoomByKey(roomKey);
    } else {
        // Guest verlässt -> nur diesen User entfernen
        await removePlayerFromRoom(roomKey, userId);
    }
}

export async function spinRoom(userId: string, roomKey: string, direction: string): Promise<SpinRandomResponseBody> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may spin", 403);

    const ranNum = randomInt(140, 901);
    const spunAt = new Date().toISOString();
    await updateRoomSpin(roomKey, ranNum, spunAt, direction);

    const token = randomUUID();
    const spinToken = await insertSpinToken(token, userId);
    return { ranNum, spinToken };
}

export async function setRoomNames(userId: string, roomKey: string, names: string[]): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may update wheel items", 403);
    await updateRoomNames(roomKey, names);
}

export async function resetRoom(userId: string, roomKey: string): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may reset", 403);
    await updateRoomReset(roomKey);
}

export async function setMultiplier(userId: string, roomKey: string, multiplier: number): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may change the multiplier", 403);
    const clamped = Math.min(2, Math.max(1, multiplier));
    await updateRoomMultiplier(roomKey, clamped);
}