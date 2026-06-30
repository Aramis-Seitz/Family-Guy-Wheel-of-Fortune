import { supabaseClient } from "../lib/supabase-client";

export type RoomPlayer = { id: string; username: string };

export type RoomData = {
    id: string;
    host_id: string;
    players: RoomPlayer[];
    wheel_items?: string[];
    last_spin?: number | null;
    spun_at?: string | null;
    multiplier?: number | null;
    spin_direction?: string | null;
};

export async function insertRoom(roomKey: string, hostId: string, hostUsername: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .insert({ 
            room_key: roomKey, 
            host_id: hostId, 
            players: [{ id: hostId, username: hostUsername }], 
            wheel_items: [] 
        });
    if (error) throw error;
}

export async function getRoomByKey(roomKey: string): Promise<RoomData | null> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .select("id, host_id, players, wheel_items, last_spin, spun_at, multiplier, spin_direction")
        .eq("room_key", roomKey)
        .single();
    if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
    }
    return data as RoomData | null;
}

export async function updateRoomPlayers(roomKey: string, players: RoomPlayer[]): Promise<RoomPlayer[]> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .update({ players })
        .eq("room_key", roomKey)
        .select("players")
        .single();
    if (error) throw error;
    return (data as { players: RoomPlayer[] }).players;
}

export async function removePlayerFromRoom(roomKey: string, userId: string): Promise<RoomPlayer[]> {
    const { data: current, error: fetchError } = await supabaseClient
        .from("rooms")
        .select("players")
        .eq("room_key", roomKey)
        .single();
    if (fetchError) throw fetchError;
    const updated = ((current as { players: RoomPlayer[] }).players ?? []).filter((p) => p.id !== userId);
    const { data, error } = await supabaseClient
        .from("rooms")
        .update({ players: updated })
        .eq("room_key", roomKey)
        .select("players")
        .single();
    if (error) throw error;
    return (data as { players: RoomPlayer[] }).players;
}

export async function updateRoomWheelItems(roomKey: string, wheelItems: string[]): Promise<string[]> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .update({ wheel_items: wheelItems })
        .eq("room_key", roomKey)
        .select("wheel_items")
        .single();
    if (error) throw error;
    return (data as { wheel_items: string[] }).wheel_items;
}

export async function clearRoomPlayers(roomKey: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ players: [] })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function updateRoomSpin(roomKey: string, lastSpin: number, spunAt: string, direction: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ last_spin: lastSpin, spun_at: spunAt, spin_direction: direction })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function updateRoomMultiplier(roomKey: string, multiplier: number): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ multiplier })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function updateRoomReset(roomKey: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .update({ last_spin: -1, spun_at: new Date().toISOString() })
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