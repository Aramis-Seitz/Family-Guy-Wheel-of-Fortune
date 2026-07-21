import { postJson } from "./api-helpers";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";
import type { CreateRoomResponseBody, JoinRoomResponseBody, SpinRandomResponseBody } from "shared";

export async function createRoom(): Promise<CreateRoomResponseBody> {
    const rawBody = await postJson("/api/room/create", undefined, {
        errorFallbackKey: "room.createFailed"
    });
    return CreateRoomResponseSchema.parse(rawBody);
}

export async function joinRoom(roomKey: string): Promise<JoinRoomResponseBody> {
    const rawBody = await postJson("/api/room/join", { roomKey }, {
        errorFallbackKey: "room.notFoundOrJoinError"
    });
    return JoinRoomResponseSchema.parse(rawBody);
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
    await postJson("/api/room/multiplier", { roomKey, multiplier }, {
        errorFallbackKey: "api.room.multiplierFailed"
    });
}

export async function spinRoom(roomKey: string, names: string[], direction: string): Promise<SpinRandomResponseBody> {
    const rawBody = await postJson("/api/room/spin", { roomKey, names, direction }, {
        errorFallbackKey: "room.spinFailed"
    });
    return SpinRandomResponseSchema.parse(rawBody);
}

export async function leaveRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/leave", { roomKey }, {
        errorFallbackKey: "room.leaveFailed"
    });
}

export function leaveRoomOnUnload(roomKey: string, token: string): void {
    void postJson("/api/room/leave", { roomKey }, { token, keepalive: true });
}

export async function closeRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/close", { roomKey }, {
        errorFallbackKey: "room.closeFailed"
    });
}

export async function updateRoomNames(roomKey: string, names: string[]): Promise<void> {
    await postJson("/api/room/wheel-items", { roomKey, names }, {
        errorFallbackKey: "api.room.updateWheelFailed"
    });
}

export async function resetRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/reset", { roomKey }, {
        errorFallbackKey: "room.resetFailed"
    });
}
