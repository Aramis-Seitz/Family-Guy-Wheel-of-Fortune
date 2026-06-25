import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { getProfileByUserId } from "../repositories/profile-repository";
import {
    insertRoom,
    getRoomByKey,
    updateRoomPlayers,
    updateRoomWheelItems,
    clearRoomPlayers,
    updateRoomSpin,
    updateRoomMultiplier,
    insertSpinToken,
} from "../repositories/room-repository";
import { AppError } from "../lib/errors";

function generateRoomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(6);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function createRoom(userId: string): Promise<{ roomKey: string; players: string[]; wheelItems: string[] }> {
    const profile = await getProfileByUserId(userId);
    const hostUsername = profile?.username ?? userId;
    const roomKey = generateRoomKey();
    await insertRoom(roomKey, userId, hostUsername);
    return { roomKey, players: [hostUsername], wheelItems: [] };
}

export async function joinRoom(userId: string, roomKey: string): Promise<{ players: string[]; multiplier: number; wheelItems: string[] }> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    const profile = await getProfileByUserId(userId);
    const username = profile?.username ?? userId;
    const currentPlayers = room.players ?? [];
    const updatedPlayers = currentPlayers.includes(username)
        ? currentPlayers
        : [...currentPlayers, username];

    const players = await updateRoomPlayers(roomKey, updatedPlayers);
    const multiplier = room.multiplier ?? 1;
    const wheelItems = room.wheel_items ?? [];
    return { players, multiplier, wheelItems };
}

export async function closeRoom(userId: string, roomKey: string): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may close the room", 403);
    await clearRoomPlayers(roomKey);
}

export async function spinRoom(userId: string, roomKey: string): Promise<{ ranNum: number; spinToken: string }> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may spin", 403);

    const ranNum = randomInt(140, 901);
    const spunAt = new Date().toISOString();
    await updateRoomSpin(roomKey, ranNum, spunAt);

    const token = randomUUID();
    const spinToken = await insertSpinToken(token, userId);
    return { ranNum, spinToken };
}

export async function setRoomWheelItems(userId: string, roomKey: string, wheelItems: string[]): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may update wheel items", 403);
    await updateRoomWheelItems(roomKey, wheelItems);
}

export async function setMultiplier(userId: string, roomKey: string, multiplier: number): Promise<void> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError("Only the host may change the multiplier", 403);
    const clamped = Math.min(2, Math.max(1, multiplier));
    await updateRoomMultiplier(roomKey, clamped);
}
