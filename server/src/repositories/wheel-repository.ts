import { supabaseClient } from "../lib/supabase-client";
import { SavedWheel } from "../types/wheel";
import { INVENTORY_LIMIT } from "../const/inventory";

export async function deleteWheelById(userId: string, wheelId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("saved_wheels")
        .delete()
        .eq("id", wheelId)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function listSavedWheels(userId: string): Promise<SavedWheel[]> {
    const { data, error } = await supabaseClient
        .from("saved_wheels")
        .select(`
  id,
  title:link_name,
  link:url,
  created_at
 `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(INVENTORY_LIMIT);

    if (error) {
        console.error("Fehler beim Laden:", error);
        return [];
    }

    return data ?? [];
}