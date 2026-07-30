import { beforeEach, describe, expect, it, vi } from "vitest";

const roomRepository = vi.hoisted(() => ({
    getRoomByKey: vi.fn(),
    updateRoomSpin: vi.fn(),
    updateRoomNames: vi.fn(),
    updateRoomReset: vi.fn(),
    updateRoomMultiplier: vi.fn(),
}));

vi.mock("../repositories/room-repository", () => ({
    ...roomRepository,
    getActiveRoomForUser: vi.fn(),
    insertRoom: vi.fn(),
    updateRoomPlayers: vi.fn(),
    clearRoomPlayers: vi.fn(),
    deleteRoomByKey: vi.fn(),
    removePlayerFromRoom: vi.fn(),
}));
vi.mock("../repositories/profile-repository", () => ({ getProfileByUserId: vi.fn() }));
vi.mock("../services/spin-service", () => ({ generateSpin: vi.fn() }));

import { resetRoom, setMultiplier, setRoomNames, spinRoom } from "../services/room-service";

describe("room-service host authorization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        roomRepository.getRoomByKey.mockResolvedValue({ host_id: "host-id" });
    });

    it.each([
        ["spin", () => spinRoom("guest-id", "ROOM01", "left")],
        ["reset", () => resetRoom("guest-id", "ROOM01", false)],
        ["wheel names", () => setRoomNames("guest-id", "ROOM01", ["Peter"])],
        ["multiplier", () => setMultiplier("guest-id", "ROOM01", 1.5)],
    ])("rejects a guest attempting to change %s", async (_action, attempt) => {
        await expect(attempt()).rejects.toMatchObject({ statusCode: 403 });
    });

    it("normalizes valid host wheel names before persisting them", async () => {
        await setRoomNames("host-id", "ROOM01", [" Peter ", "Lois"]);

        expect(roomRepository.updateRoomNames).toHaveBeenCalledWith("ROOM01", ["Peter", "Lois"]);
    });

    it("rejects malformed or excessive wheel names", async () => {
        await expect(setRoomNames("host-id", "ROOM01", ["invalid name"])).rejects.toMatchObject({ statusCode: 400 });
        await expect(setRoomNames("host-id", "ROOM01", Array.from({ length: 17 }, () => "Peter"))).rejects.toMatchObject({ statusCode: 400 });
    });
});