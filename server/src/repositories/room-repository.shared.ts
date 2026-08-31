export type RoomPlayer = { id: string; username: string };

// Ein Rad-Eintrag, wie er beim Spin aufgelöst und am Spin-Token festgehalten
// wird. userId === null heißt: der Name wurde von Hand in die
// names-in-wheel-list eingetragen und gehört zu keinem Account.
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
