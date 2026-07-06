import { supabaseClient } from "../lib/supabase-client";

export async function deleteWheelById(userId: string, wheelId: string): Promise<void> {
    const { error } = await supabaseClient
        .from("saved_links")
        .delete()
        .eq("id", wheelId)
        .eq("user_id", userId);

    if (error) throw error;
}