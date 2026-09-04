import { postJson, patchJson, deleteJson, getCurrentUserId } from "./api-helpers";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";
import type { CreateRoomResponseBody, JoinRoomResponseBody, SpinRandomResponseBody } from "shared";

export async function createRoom(): Promise<CreateRoomResponseBody> {
    const rawBody = await postJson("/api/rooms", undefined, {
        errorFallbackKey: "api.room.createFailed"
    });
    return CreateRoomResponseSchema.parse(rawBody);
}

export async function joinRoom(roomKey: string): Promise<JoinRoomResponseBody> {
    const rawBody = await postJson(`/api/rooms/${roomKey}/players`, undefined, {
        errorFallbackKey: "api.room.joinFailed"
    });
    return JoinRoomResponseSchema.parse(rawBody);
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
    await patchJson(`/api/rooms/${roomKey}/multiplier`, { multiplier }, {
        errorFallbackKey: "api.room.multiplierFailed"
    });
}

export async function spinRoom(roomKey: string, direction: string): Promise<SpinRandomResponseBody> {
    const rawBody = await postJson(`/api/rooms/${roomKey}/spins`, { direction }, {
        errorFallbackKey: "api.room.spinFailed"
    });
    return SpinRandomResponseSchema.parse(rawBody);
}

export async function leaveRoom(roomKey: string): Promise<void> {
    const userId = await getCurrentUserId();
    await deleteJson(`/api/rooms/${roomKey}/players/${userId}`, {
        errorFallbackKey: "api.room.leaveFailed"
    });
}

export function leaveRoomOnUnload(roomKey: string, userId: string, token: string): void {
    void deleteJson(`/api/rooms/${roomKey}/players/${userId}`, { token, keepalive: true });
}

export async function updateRoomNames(roomKey: string, names: string[]): Promise<void> {
    await patchJson(`/api/rooms/${roomKey}/names-in-wheel-list`, { names }, {
        errorFallbackKey: "api.room.updateWheelFailed"
    });
}

export async function syncPlayersInWheel(roomKey: string, playerDisplayNames: string[]): Promise<void> {
    await patchJson(`/api/rooms/${roomKey}/players-in-wheel-list`, { playerDisplayNames }, {
        errorFallbackKey: "api.room.updateWheelFailed"
    });
}

export async function resetRoom(roomKey: string, closeWinnerModal = false): Promise<void> {
    await patchJson(`/api/rooms/${roomKey}`, { closeWinnerModal }, {
        errorFallbackKey: "api.room.resetFailed"
    });
}
