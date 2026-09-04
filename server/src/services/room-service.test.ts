import { describe, expect, it, vi } from "vitest";
import { leaveRoom, setRoomNames, syncPlayersInWheel } from "./room-service";

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
    updateRoomNames,
} from "../repositories/room-repository";

describe("leaveRoom", () => {
    it("schliesst den room, wenn der host den room verlaesst", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        await leaveRoom("host-1", "ABC123");

        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(clearRoomPlayers).toHaveBeenCalledWith("ABC123");
        expect(deleteRoomByKey).toHaveBeenCalledWith("ABC123");
    });

    it("entfernt nur den gast, wenn ein nicht-host den room verlaesst", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        await leaveRoom("guest-1", "ABC123");

        expect(getRoomByKey).toHaveBeenCalledWith("ABC123");
        expect(removePlayerFromRoom).toHaveBeenCalledWith("ABC123", "guest-1");
    });

    it("wirft 404, wenn room nicht existiert", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce(null);

        const result = leaveRoom("any-user", "ABC123");

        await expect(result).rejects.toMatchObject({
            name: "AppError",
            statusCode: 404,
            message: "Room not found",
        });
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

        const result = leaveRoom("host-1", "ABC123");

        await expect(result).rejects.toBe(clearError);
        
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

        const result = leaveRoom("host-1", "ABC123");

        await expect(result).rejects.toBe(deleteError);
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

        const result = leaveRoom("guest-1", "ABC123");

        await expect(result).rejects.toBe(removeError);
    });
});

describe("setRoomNames", () => {
    it("speichert manuell eingegebene Namen immer mit isPlayer:false", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        await setRoomNames("host-1", "ABC123", ["Alice", "Bob"]);

        expect(updateRoomNames).toHaveBeenCalledWith("ABC123", [
            { text: "Alice", isPlayer: false },
            { text: "Bob", isPlayer: false },
        ]);
    });

    it("wirft 403, wenn ein nicht-host die namen aendern will", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: [],
        });

        const result = setRoomNames("guest-1", "ABC123", ["Alice"]);

        await expect(result).rejects.toMatchObject({ statusCode: 403 });
        expect(updateRoomNames).not.toHaveBeenCalled();
    });
});

describe("syncPlayersInWheel", () => {
    const roomPlayers = [
        { id: "host-1", username: "Lewis4", suffix: 0 },
        { id: "guest-1", username: "Brian", suffix: 0 },
    ];

    it("fuegt fehlende room-player als isPlayer:true entries hinzu, mit serverseitig gebautem Anzeigenamen", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: roomPlayers,
            names_in_wheel: [{ text: "Quagmire", isPlayer: false }],
        });

        await syncPlayersInWheel("host-1", "ABC123", ["Lewis4#00"]);

        expect(updateRoomNames).toHaveBeenCalledWith("ABC123", [
            { text: "Quagmire", isPlayer: false },
            { text: "Lewis4#00", isPlayer: true },
        ]);
    });

    it("entfernt player entries wieder, wenn sie schon alle im wheel sind", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: roomPlayers,
            names_in_wheel: [
                { text: "Quagmire", isPlayer: false },
                { text: "Lewis4#00", isPlayer: true },
            ],
        });

        await syncPlayersInWheel("host-1", "ABC123", ["Lewis4#00"]);

        expect(updateRoomNames).toHaveBeenCalledWith("ABC123", [
            { text: "Quagmire", isPlayer: false },
        ]);
    });

    it("ignoriert namen, die zu keinem echten room-player gehoeren, statt sie zu erfinden", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: roomPlayers,
            names_in_wheel: [],
        });

        await syncPlayersInWheel("host-1", "ABC123", ["Lewis4#00", "Peter#99"]);

        expect(updateRoomNames).toHaveBeenCalledWith("ABC123", [
            { text: "Lewis4#00", isPlayer: true },
        ]);
    });

    it("laesst einen manuellen eintrag mit gleichem text unangetastet, wenn er nicht isPlayer ist", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: roomPlayers,
            names_in_wheel: [{ text: "Lewis4#00", isPlayer: false }],
        });

        await syncPlayersInWheel("host-1", "ABC123", ["Lewis4#00"]);

        expect(updateRoomNames).toHaveBeenCalledWith("ABC123", [
            { text: "Lewis4#00", isPlayer: false },
            { text: "Lewis4#00", isPlayer: true },
        ]);
    });

    it("wirft 403, wenn ein nicht-host die player synchronisieren will", async () => {
        vi.mocked(getRoomByKey).mockResolvedValueOnce({
            id: "room-1",
            room_key: "ABC123",
            host_id: "host-1",
            players: roomPlayers,
            names_in_wheel: [],
        });

        const result = syncPlayersInWheel("guest-1", "ABC123", ["Lewis4#00"]);

        await expect(result).rejects.toMatchObject({ statusCode: 403 });
        expect(updateRoomNames).not.toHaveBeenCalled();
    });
});
