import { z } from "zod";

export const SavedWheelSchema = z.object({
    id: z.string(),
    title: z.string(),
    link: z.string().nullable(),
    created_at: z.string(),
});
export type SavedWheel = z.infer<typeof SavedWheelSchema>;

export const SavedWheelResponseSchema = z.object({
    savedWheels: z.array(SavedWheelSchema),
});
export type SavedWheelResponseBody = z.infer<typeof SavedWheelResponseSchema>;

export const SelectResponseSchema = z.object({
    success: z.literal(true),
    assetId: z.string(),
});
export type SelectResponseBody = z.infer<typeof SelectResponseSchema>;
