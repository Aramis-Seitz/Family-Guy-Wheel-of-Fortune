import { beforeEach, describe, expect, it, vi } from "vitest";
import { leaveRoom } from "./room-service";

// Mocke die Abhängigkeiten, die in leaveRoom verwendet werden
vi.mock("../repositories/room-repository", () => ({
    insertRoom: vi.fn(),
    getRoomByKey: vi.fn(),
    getActiveRoomForUser: vi.fn(),
    updateRoomPlayers: vi.fn(),
    updateRoomNames: vi.fn(),
    clearRoomPlayers: vi.fn(),
    deleteRoomByKey: vi.fn(),
    removePlayerFromRoom: vi.fn(),
    updateRoomSpin: vi.fn(),
    updateRoomMultiplier: vi.fn(),
    updateRoomReset: vi.fn(),
}));

vi.mock("../repositories/profile-repository", () => ({
    getProfileByUserId: vi.fn(),
}));

vi.mock("../services/spin-service", () => ({
    generateSpin: vi.fn(),
}));

import {
    clearRoomPlayers,
    deleteRoomByKey,
    getRoomByKey,
    removePlayerFromRoom,
} from "../repositories/room-repository";


describe("leaveRoom", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("schliesst den room, wenn der host den room verlaesst", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        await expect(leaveRoom("host-1", "ABC123")).resolves.toBeUndefined();

        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(clearRoomPlayers).toHaveBeenCalledWith("ABC123");
        expect(deleteRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(removePlayerFromRoom).not.toHaveBeenCalled();
    });

    it("entfernt nur den gast, wenn ein nicht-host den room verlaesst", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        await expect(leaveRoom("guest-1", "ABC123")).resolves.toBeUndefined();

        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(removePlayerFromRoom).toHaveBeenCalledWith("ABC123", "guest-1");
        expect(clearRoomPlayers).not.toHaveBeenCalled();
        expect(deleteRoomByKey).not.toHaveBeenCalled();
    });

    it("wirft 404, wenn room nicht existiert", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce(null);

        await expect(leaveRoom("any-user", "ABC123")).rejects.toMatchObject({
            name: "AppError",
            statusCode: 404,
            message: "Room not found",
        });

        expect(clearRoomPlayers).not.toHaveBeenCalled();
        expect(deleteRoomByKey).not.toHaveBeenCalled();
        expect(removePlayerFromRoom).not.toHaveBeenCalled();
    });

    it("reicht den fehler durch, wenn clearRoomPlayers fehlschlaegt", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        const clearError = new Error("clear failed");
        vi.mocked(clearRoomPlayers).mockRejectedValueOnce(clearError);

        await expect(leaveRoom("host-1", "ABC123")).rejects.toBe(clearError);
        expect(deleteRoomByKey).not.toHaveBeenCalled();
    });

    it("reicht den fehler durch, wenn deleteRoomByKey fehlschlaegt", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        const deleteError = new Error("delete failed");
        vi.mocked(deleteRoomByKey).mockRejectedValueOnce(deleteError);

        await expect(leaveRoom("host-1", "ABC123")).rejects.toBe(deleteError);
    });

    it("reicht den fehler durch, wenn removePlayerFromRoom fehlschlaegt", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        const removeError = new Error("remove failed");
        vi.mocked(removePlayerFromRoom).mockRejectedValueOnce(removeError);

        await expect(leaveRoom("guest-1", "ABC123")).rejects.toBe(removeError);
    });
});
