import { z } from "zod";

export const SpinRandomResponseSchema = z.object({
    ranNum: z.number(),
    spinToken: z.string(),
});
export type SpinRandomResponseBody = z.infer<typeof SpinRandomResponseSchema>;

export const AwardCoinsResponseSchema = z.object({
    spinnerCoins: z.number(),
    winnerCoins: z.number(),
    total: z.number().optional(),
});
export type AwardCoinsResponseBody = z.infer<typeof AwardCoinsResponseSchema>;
