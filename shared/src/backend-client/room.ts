import { z } from "zod";

export const WheelEntrySchema = z.object({
    text: z.string(),
    isPlayer: z.boolean(),
});
export type WheelEntry = z.infer<typeof WheelEntrySchema>;

export const CreateRoomResponseSchema = z.object({
    roomKey: z.string(),
    players: z.array(z.string()),
    names: z.array(WheelEntrySchema),
});
export type CreateRoomResponseBody = z.infer<typeof CreateRoomResponseSchema>;

export const JoinRoomResponseSchema = z.object({
    players: z.array(z.string()),
    multiplier: z.number(),
    names: z.array(WheelEntrySchema),
    hostName: z.string(),
});
export type JoinRoomResponseBody = z.infer<typeof JoinRoomResponseSchema>;
