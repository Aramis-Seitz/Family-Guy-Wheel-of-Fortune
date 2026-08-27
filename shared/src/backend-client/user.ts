import { z } from "zod";

export const CoinsResponseSchema = z.object({
    coins: z.number(),
});
export type CoinsResponseBody = z.infer<typeof CoinsResponseSchema>;

export const ProfileResponseSchema = z.object({
    profile: z.object({
        username: z.string(),
        suffix: z.number().int().min(0).max(99),
        coins: z.number(),
    }),
});
export type ProfileResponseBody = z.infer<typeof ProfileResponseSchema>;
