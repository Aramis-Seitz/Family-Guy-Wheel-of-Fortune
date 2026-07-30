import { randomBytes } from "node:crypto";
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
    type RoomPlayer,
} from "../repositories/room-repository";
import { generateSpin } from "./spin-service";
import { AppError } from "../lib/errors";
import type { CreateRoomResponseBody, JoinRoomResponseBody, SpinRandomResponseBody } from "shared";

const MAX_WHEEL_NAMES = 16;
const WHEEL_NAME_PATTERN = /^[A-Za-z0-9']+$/;

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

function requireRoomHost(room: { host_id: string } | null, userId: string, action: string): void {
    if (!room) throw new AppError("Room not found", 404);
    if (room.host_id !== userId) throw new AppError(`Only the host may ${action}`, 403);
}

function validateRoomNames(names: string[]): string[] {
    if (names.length > MAX_WHEEL_NAMES) {
        throw new AppError(`A room may contain at most ${MAX_WHEEL_NAMES} wheel names`, 400);
    }

    const normalizedNames = names.map((name) => name.trim());
    if (normalizedNames.some((name) => !name || !WHEEL_NAME_PATTERN.test(name))) {
        throw new AppError("Wheel names must contain only letters, numbers, or apostrophes", 400);
    }
    return normalizedNames;
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

    const hostId = room.host_id;
    if (userId === hostId) {
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
    requireRoomHost(room, userId, "spin");
    if (direction !== "left" && direction !== "right") throw new AppError("Invalid spin direction", 400);

    const { ranNum, spinToken } = await generateSpin(userId);
    const spunAt = new Date().toISOString();
    await updateRoomSpin(roomKey, ranNum, spunAt, direction);

    return { ranNum, spinToken };
}

export async function setRoomNames(userId: string, roomKey: string, names: string[]): Promise<void> {
    const room = await getRoomByKey(roomKey);
    requireRoomHost(room, userId, "update wheel items");
    await updateRoomNames(roomKey, validateRoomNames(names));
}

export async function resetRoom(userId: string, roomKey: string, closeWinnerModal: boolean): Promise<void> {
    const room = await getRoomByKey(roomKey);
    requireRoomHost(room, userId, "reset");
    await updateRoomReset(roomKey, closeWinnerModal);
}

export async function setMultiplier(userId: string, roomKey: string, multiplier: number): Promise<void> {
    const room = await getRoomByKey(roomKey);
    requireRoomHost(room, userId, "change the multiplier");
    if (!Number.isFinite(multiplier)) throw new AppError("Invalid multiplier", 400);
    const clamped = Math.min(2, Math.max(1, multiplier));
    await updateRoomMultiplier(roomKey, clamped);
}