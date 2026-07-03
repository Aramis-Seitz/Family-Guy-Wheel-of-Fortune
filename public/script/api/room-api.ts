import { postJson } from "./api-helpers.js";
import type { CreateRoomResponse, JoinRoomResponse, RoomSpinResponse } from "../shared/types.js";


export async function createRoom(): Promise<CreateRoomResponse> {
    return postJson<CreateRoomResponse>("/api/room/create", undefined, {
        errorFallback: "Room konnte nicht erstellt werden"
    });
}

export async function joinRoom(roomKey: string): Promise<JoinRoomResponse> {
    return postJson<JoinRoomResponse>("/api/room/join", { roomKey }, {
        errorFallback: "Beitritt zum Room fehlgeschlagen"
    });
}

export async function setMultiplier(roomKey: string, multiplier: number): Promise<void> {
    await postJson("/api/room/multiplier", { roomKey, multiplier }, {
        errorFallback: "Multiplikator konnte nicht gesetzt werden"
    });
}

export async function spinRoom(roomKey: string, names: string[], direction: string): Promise<RoomSpinResponse> {
    return postJson<RoomSpinResponse>("/api/room/spin", { roomKey, names, direction }, {
        errorFallback: "Spin fehlgeschlagen"
    });
}

export async function leaveRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/leave", { roomKey }, {
        errorFallback: "Room konnte nicht verlassen werden"
    });
}

export function leaveRoomOnUnload(roomKey: string, token: string): void {
    void postJson("/api/room/leave", { roomKey }, { token, keepalive: true });
}

export async function closeRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/close", { roomKey }, {
        errorFallback: "Room konnte nicht geschlossen werden"
    });
}

export async function updateRoomNames(roomKey: string, names: string[]): Promise<void> {
    await postJson("/api/room/wheel-items", { roomKey, names }, {
        errorFallback: "Wheel-Items konnten nicht aktualisiert werden"
    });
}

export async function resetRoom(roomKey: string): Promise<void> {
    await postJson("/api/room/reset", { roomKey }, {
        errorFallback: "Room konnte nicht zurückgesetzt werden"
    });
}
