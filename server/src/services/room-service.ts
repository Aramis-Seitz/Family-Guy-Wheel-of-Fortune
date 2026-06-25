import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { getProfileByUserId } from "../repositories/profile-repository";
import {
    insertRoom,
    getRoomByKey,
    updateRoomPlayers,
    clearRoomPlayers,
    removePlayerFromRoom,
    updateRoomSpin,
    updateRoomMultiplier,
    updateRoomReset,
    insertSpinToken,
    type RoomPlayer,
} from "../repositories/room-repository";
import { AppError } from "../lib/errors";

function generateRoomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(6);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function toUsernames(players: RoomPlayer[]): string[] {
    return players.map((p) => p.username);
}

export async function createRoom(userId: string): Promise<{ roomKey: string; players: string[] }> {
    const profile = await getProfileByUserId(userId);
    const hostUsername = profile?.username ?? userId;
    const roomKey = generateRoomKey();
    await insertRoom(roomKey, userId, hostUsername);
    return { roomKey, players: [hostUsername] };
}

export async function joinRoom(userId: string, roomKey: string): Promise<{ players: string[]; multiplier: number }> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    const profile = await getProfileByUserId(userId);
    const username = profile?.username ?? userId;
    const currentPlayers = room.players ?? [];
    const updatedPlayers = currentPlayers.some((p) => p.id === userId)
        ? currentPlayers
        : [...currentPlayers, { id: userId, username }];

    const players = await updateRoomPlayers(roomKey, updatedPlayers);
    const multiplier = room.multiplier ?? 1;
    return { players: toUsernames(players), multiplier };
}

export async function leaveRoom(userId: string, roomKey: string): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    if (room.host_id === userId) {
        // Host verlässt → Raum schließen
        await clearRoomPlayers(roomKey);
    } else {
        // Gast verlässt → nur diesen Spieler nach userId entfernen
        await removePlayerFromRoom(roomKey, userId);
    }
}

export async function closeRoom(userId: string, roomKey: string): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may close the room", 403);
    await clearRoomPlayers(roomKey);
}

export async function spinRoom(userId: string, roomKey: string, direction: string): Promise<{ ranNum: number; spinToken: string }> {
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
