import { supabaseClient } from "../lib/supabase-client";
import type { RoomPlayer, RoomData, NameInWheel } from "./room-repository.shared";

export async function getActiveRoomForUser(userId: string): Promise<RoomData | null> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .select("id, host_id, players, last_spin, spun_at, multiplier, spin_direction, room_key")
        .filter("players", "cs", JSON.stringify([{ id: userId }]))
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data as RoomData | null;
}

export async function insertRoom(roomKey: string, hostId: string, hostUsername: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .insert({
            room_key: roomKey,
            host_id: hostId,
            players: [{ id: hostId, username: hostUsername }],
            names_in_wheel: []
        });
    if (error) throw error;
}

export async function getRoomByKey(roomKey: string): Promise<RoomData | null> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .select("id, host_id, players, names_in_wheel, last_spin, spun_at, multiplier, spin_direction")
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

export async function updateRoomNames(roomKey: string, names: string[]): Promise<string[]> {
    const { data, error } = await supabaseClient
        .from("rooms")
        .update({ names_in_wheel: names })
        .eq("room_key", roomKey)
        .select("names_in_wheel")
        .single();
    if (error) throw error;
    return (data as { names_in_wheel: string[] }).names_in_wheel;
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

export async function updateRoomReset(roomKey: string, closeWinnerModal: boolean): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from("rooms")
        .update(closeWinnerModal
            ? { wheel_reset_at: now, winner_modal_close_at: now }
            : { wheel_reset_at: now })
        .eq("room_key", roomKey);
    if (error) throw error;
}

export async function insertSpinToken(token: string, userId: string, namesInWheel: NameInWheel[]): Promise<string> {
    const { data, error } = await supabaseClient
        .from("spin_tokens")
        .insert({ token, user_id: userId, used: false, names_in_wheel: namesInWheel })
        .select("token")
        .single();
    if (error) throw error;
    return (data as { token: string }).token;
}

// null = Token existiert nicht, gehört einem anderen User oder wurde bereits
// verbraucht. Ein leeres Array heißt dagegen: Token gültig, aber ohne Rad.
export async function findSpinTokenNamesInWheel(token: string, userId: string): Promise<NameInWheel[] | null> {
    const { data, error } = await supabaseClient
        .from("spin_tokens")
        .select("names_in_wheel")
        .eq("token", token)
        .eq("user_id", userId)
        .eq("used", false)
        .single();
    if (error || !data) return null;
    return (data as { names_in_wheel: NameInWheel[] | null }).names_in_wheel ?? [];
}

export async function markSpinTokenUsed(token: string): Promise<void> {
    const { error } = await supabaseClient
        .from("spin_tokens")
        .update({ used: true })
        .eq("token", token);
    if (error) throw error;
}

export async function deleteRoomByKey(roomKey: string): Promise<void> {
    const { error } = await supabaseClient
        .from("rooms")
        .delete()
        .eq("room_key", roomKey);
    if (error) throw error;
}
