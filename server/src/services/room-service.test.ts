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

// Importiere die Funktionen, die wir in den Tests verwenden möchten
import {
    clearRoomPlayers,
    deleteRoomByKey,
    getRoomByKey,
    removePlayerFromRoom,
} from "../repositories/room-repository";

// Test-Suite für leaveRoom
describe("leaveRoom", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Testfall 1
    it("schliesst den room, wenn der host den room verlaesst", async () => {
        // Mocke die Rückgabe von getRoomByKey, um einen Raum mit dem Host zurückzugeben
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        // Rufe leaveRoom mit dem Host auf
        await expect(leaveRoom("host-1", "ABC123")).resolves.toBeUndefined();

        // Überprüfe, dass die richtigen Funktionen mit den erwarteten Argumenten aufgerufen wurden
        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(clearRoomPlayers).toHaveBeenCalledWith("ABC123");
        expect(deleteRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(removePlayerFromRoom).not.toHaveBeenCalled();
    });

    // Testfall 2
    it("entfernt nur den gast, wenn ein nicht-host den room verlaesst", async () => {
        // Mocke die Rückgabe von getRoomByKey, um einen Raum mit einem Host zurückzugeben
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        // Rufe leaveRoom mit einem Gast auf
        await expect(leaveRoom("guest-1", "ABC123")).resolves.toBeUndefined();

        // Überprüfe, dass die richtigen Funktionen mit den erwarteten Argumenten aufgerufen wurden
        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(removePlayerFromRoom).toHaveBeenCalledWith("ABC123", "guest-1");
        expect(clearRoomPlayers).not.toHaveBeenCalled();
        expect(deleteRoomByKey).not.toHaveBeenCalled();
    });

    // Testfall 3
    it("wirft 404, wenn room nicht existiert", async () => {
        // Mocke die Rückgabe von getRoomByKey, um null zurückzugeben (Raum existiert nicht)
        vi.mocked(getRoomByKey).mockResolvedValueOnce(null);

        await expect(leaveRoom("any-user", "ABC123")).rejects.toMatchObject({
            name: "AppError",
            statusCode: 404,
            message: "Room not found",
        });

        // Überprüfe, dass keine der Funktionen aufgerufen wurde, da der Raum nicht existiert
        expect(clearRoomPlayers).not.toHaveBeenCalled();
        expect(deleteRoomByKey).not.toHaveBeenCalled();
        expect(removePlayerFromRoom).not.toHaveBeenCalled();
    });

    // Testfall 4
    it("reicht den fehler durch, wenn clearRoomPlayers fehlschlaegt", async () => {
        // Mocke die Rückgabe von getRoomByKey, um einen Raum mit dem Host zurückzugeben
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        // Simuliere einen Fehler beim Aufruf von clearRoomPlayers
        const clearError = new Error("clear failed");
        vi.mocked(clearRoomPlayers).mockRejectedValueOnce(clearError);

        // Rufe leaveRoom mit dem Host auf und erwarte, dass der Fehler weitergereicht wird
        await expect(leaveRoom("host-1", "ABC123")).rejects.toBe(clearError);
        expect(deleteRoomByKey).not.toHaveBeenCalled();
    });

    // Testfall 5
    it("reicht den fehler durch, wenn deleteRoomByKey fehlschlaegt", async () => {
        // Mocke die Rückgabe von getRoomByKey, um einen Raum mit dem Host zurückzugeben
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        // Simuliere einen Fehler beim Aufruf von deleteRoomByKey
        const deleteError = new Error("delete failed");
        vi.mocked(deleteRoomByKey).mockRejectedValueOnce(deleteError);

        // Rufe leaveRoom mit dem Host auf und erwarte, dass der Fehler weitergereicht wird
        await expect(leaveRoom("host-1", "ABC123")).rejects.toBe(deleteError);
    });

    // Testfall 6
    it("reicht den fehler durch, wenn removePlayerFromRoom fehlschlaegt", async () => {
        // Mocke die Rückgabe von getRoomByKey, um einen Raum mit einem Host zurückzugeben
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        // Simuliere einen Fehler beim Aufruf von removePlayerFromRoom
        const removeError = new Error("remove failed");
        vi.mocked(removePlayerFromRoom).mockRejectedValueOnce(removeError);

        // Rufe leaveRoom mit einem Gast auf und erwarte, dass der Fehler weitergereicht wird
        await expect(leaveRoom("guest-1", "ABC123")).rejects.toBe(removeError);
    });
});
