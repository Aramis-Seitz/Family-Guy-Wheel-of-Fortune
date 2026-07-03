import { postJson } from "./api-helpers";
import { RoomSpinResponse } from "../shared/types";


export async function createRoom(): Promise<{ roomKey: string; players: string[]; names: string[] }> {
    return postJson<{ roomKey: string; players: string[]; names: string[] }>('/api/room/create');
}

export async function joinRoom(roomKey: string): Promise<{ players: string[]; multiplier: number; names: string[]; hostName: string }> {
    return postJson<{ players: string[]; multiplier: number; names: string[]; hostName: string }>('/api/room/join', { roomKey });
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
    await postJson('/api/room/multiplier', { roomKey, multiplier });
}

export async function spinRoom(roomKey: string, names: string[], direction: string): Promise<RoomSpinResponse> {
    return postJson<RoomSpinResponse>('/api/room/spin', { roomKey, names, direction });
}

export async function leaveRoom(roomKey: string): Promise<void> {
    await postJson('/api/room/leave', { roomKey });
}

export function leaveRoomOnUnload(roomKey: string, token: string): void {
    void postJson('/api/room/leave', { roomKey }, { token, keepalive: true });
}

export async function closeRoom(roomKey: string): Promise<void> {
    await postJson('/api/room/close', { roomKey });
}

export async function updateRoomNames(roomKey: string, names: string[]): Promise<void> {
    await postJson('/api/room/wheel-items', { roomKey, names });
}

export async function resetRoom(roomKey: string): Promise<void> {
    await postJson('/api/room/reset', { roomKey });
}