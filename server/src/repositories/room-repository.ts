import { supabaseClient } from "../lib/supabase-client";

export type RoomData = {
    id: string;
    host_id: string;
    players: string[];
    last_spin?: number | null;
    spun_at?: string | null;
};

export async function insertRoom(roomKey: string, hostId: string, hostUsername: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .insert({ room_key: roomKey, host_id: hostId, players: [hostUsername] });
    if (error) throw error;
}

export async function getRoomByKey(roomKey: string): Promise<RoomData | null> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .select("id, host_id, players, last_spin, spun_at")
        .eq("room_key", roomKey)
        .single();
    if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
    }
    return data as RoomData | null;
}

export async function updateRoomPlayers(roomKey: string, players: string[]): Promise<string[]> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .update({ players })
        .eq("room_key", roomKey)
        .select("players")
        .single();
    if (error) throw error;
    return (data as { players: string[] }).players;
}

export async function clearRoomPlayers(roomKey: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ players: [] })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function updateRoomSpin(roomKey: string, lastSpin: number, spunAt: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ last_spin: lastSpin, spun_at: spunAt })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function insertSpinToken(token: string, userId: string): Promise<string> {
    const { data, error } = await supabaseClient
        .from("spin_tokens")
        .insert({ token, user_id: userId, used: false })
        .select("token")
        .single();
    if (error) throw error;
    return (data as { token: string }).token;
}

export async function findValidSpinToken(token: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
        .from("spin_tokens")
        .select("token")
        .eq("token", token)
        .eq("user_id", userId)
        .eq("used", false)
        .single();
    return !error && !!data;
}

export async function markSpinTokenUsed(token: string): Promise<void> {
    const { error } = await supabaseClient
        .from("spin_tokens")
        .update({ used: true })
        .eq("token", token);
    if (error) throw error;
}
