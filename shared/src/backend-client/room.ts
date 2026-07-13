import { z } from "zod";

export const CreateRoomResponseSchema = z.object({
    roomKey: z.string(),
    players: z.array(z.string()),
    names: z.array(z.string()),
});
export type CreateRoomResponseBody = z.infer<typeof CreateRoomResponseSchema>;

export const JoinRoomResponseSchema = z.object({
    players: z.array(z.string()),
    multiplier: z.number(),
    names: z.array(z.string()),
    hostName: z.string(),
});
export type JoinRoomResponseBody = z.infer<typeof JoinRoomResponseSchema>;
