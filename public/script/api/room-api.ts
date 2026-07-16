import { postJson } from "./api-helpers";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    SpinRandomResponseSchema,
} from "shared";
import type { CreateRoomResponseBody, JoinRoomResponseBody, SpinRandomResponseBody } from "shared";

export async function createRoom(): Promise<CreateRoomResponseBody> {
    const rawBody = await postJson("/api/room/create", undefined, {
        errorFallback: "Room konnte nicht erstellt werden"
    });
    return CreateRoomResponseSchema.parse(rawBody);
}

export async function joinRoom(roomKey: string): Promise<JoinRoomResponseBody> {
    const rawBody = await postJson("/api/room/join", { roomKey }, {
        errorFallback: "Beitritt zum Room fehlgeschlagen"
    });
    return JoinRoomResponseSchema.parse(rawBody);
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
    await postJson("/api/room/multiplier", { roomKey, multiplier }, {
        errorFallback: "Multiplikator konnte nicht gesetzt werden"
    });
}

export async function spinRoom(roomKey: string, names: string[], direction: string): Promise<SpinRandomResponseBody> {
    const rawBody = await postJson("/api/room/spin", { roomKey, names, direction }, {
        errorFallback: "Spin fehlgeschlagen"
    });
    return SpinRandomResponseSchema.parse(rawBody);
}

export async function leaveRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/leave", { roomKey }, {
        errorFallback: "Room konnte nicht verlassen werden"
    });
}

export function leaveRoomOnUnload(roomKey: string, token: string): void {
    void postJson("/api/room/leave", { roomKey }, { token, keepalive: true });
}

export async function updateRoomNames(roomKey: string, names: string[]): Promise<void> {
    await postJson("/api/room/wheel-items", { roomKey, names }, {
        errorFallback: "Wheel-Items konnten nicht aktualisiert werden"
    });
}

export async function resetRoom(roomKey: string, closeWinnerModal = false): Promise<void> {
    await postJson("/api/room/reset", { roomKey, closeWinnerModal }, {
        errorFallback: "Room konnte nicht zurückgesetzt werden"
    });
}
