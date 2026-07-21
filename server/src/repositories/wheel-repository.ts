import { supabaseClient } from "../lib/supabase-client";
import type { SavedWheel } from "shared";

export async function deleteWheelById(userId: string, wheelId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("saved_wheels")
        .delete()
        .eq("id", wheelId)
        .eq("user_id", userId);

    if (error) throw error;
}

export const INVENTORY_LIMIT: number = 12;

export async function listSavedWheels(userId: string): Promise<SavedWheel[]> {
    const { data, error } = await supabaseClient
        .from("saved_wheels")
        .select(`
  id,
  title:wheel_title,
  link:url,
  created_at
 `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(INVENTORY_LIMIT);

    if (error) {
        console.error("Failed to load saved wheels:", error);
        return [];
    }

    return data ?? [];
}

export async function insertSavedWheels(userId: string, title: string, url: string): Promise<void> {
    const { error } = await supabaseClient
        .from("saved_wheels")
        .insert({
            user_id: userId,
            wheel_title: title,
            url
        });

    if (error) throw error;
}