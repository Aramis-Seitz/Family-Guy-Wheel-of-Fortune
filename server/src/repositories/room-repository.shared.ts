export type RoomPlayer = { id: string; username: string; suffix: number };

export type NameInWheel = { username: string; userId: string | null };

export type RoomData = {
    id: string;
    room_key: string;
    host_id: string;
    players: RoomPlayer[];
    names_in_wheel?: string[];
    last_spin?: number | null;
    spun_at?: string | null;
    multiplier?: number | null;
    spin_direction?: string | null;
    spin_winner?: string | null;
};
