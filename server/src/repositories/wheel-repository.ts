import { supabaseClient } from "../lib/supabase-client";

export async function deleteWheelById(userId: string, wheelId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("saved_wheels")
        .delete()
        .eq("id", wheelId)
        .eq("user_id", userId);

    if (error) throw error;
}

export const INVENTORY_LIMIT: number = 12;

export type SavedWheel = {
  id: string;
  title: string;
  link: string | null;
  created_at: string;
};

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

export async function insertSavedWheels(userId: string, title: string, url: string): Promise<{ success: boolean }> {
    const { error } = await supabaseClient
        .from("saved_wheels")
        .insert({
            user_id: userId,
            link_name: title,
            url
        });

    if (error) throw error;

    return {
        success: true
    };
}