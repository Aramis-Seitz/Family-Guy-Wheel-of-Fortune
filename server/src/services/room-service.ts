import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { getProfileByUserId } from "../repositories/profile-repository";
import {
    insertRoom,
    getRoomByKey,
    updateRoomPlayers,
    clearRoomPlayers,
    updateRoomSpin,
    insertSpinToken,
} from "../repositories/room-repository";
import { AppError } from "./errors";

function generateRoomKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(6);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function createRoom(userId: string): Promise<{ roomKey: string; players: string[] }> {
    const profile = await getProfileByUserId(userId);
    const hostUsername = profile?.username ?? userId;
    const roomKey = generateRoomKey();
    await insertRoom(roomKey, userId, hostUsername);
    return { roomKey, players: [hostUsername] };
}

export async function joinRoom(userId: string, roomKey: string): Promise<string[]> {
    const room = await getRoomByKey(roomKey);
    if (!room) throw new AppError("Room not found", 404);

    const profile = await getProfileByUserId(userId);
    const username = profile?.username ?? userId;
    const currentPlayers = room.players ?? [];
    const updatedPlayers = currentPlayers.includes(username)
        ? currentPlayers
        : [...currentPlayers, username];

    return updateRoomPlayers(roomKey, updatedPlayers);
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
