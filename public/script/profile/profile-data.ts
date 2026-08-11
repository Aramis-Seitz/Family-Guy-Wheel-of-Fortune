import { supabaseClient } from "../shared/supabase-client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getUserProfile, getUserCoins } from "./user-api";

interface UserProfileState {
    username: string | null;
    coins: number;
    isAuthenticated: boolean;
}

export class ProfileData {
    private currentState: UserProfileState = {
        username: null,
        coins: 0,
        isAuthenticated: false,
    };

    public async initializeProfile(): Promise<void> {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session?.user) {
            this.currentState = { username: null, coins: 0, isAuthenticated: false };
            return;
        }

        const profile = await getUserProfile();
        this.currentState = {
            username: profile?.username ?? null,
            coins: profile?.coins ?? 0,
            isAuthenticated: true,
        };

        this.subscribeToCoinUpdates(session.user.id);
    }

    public async refreshCoins(): Promise<void> {
        const coins = await getUserCoins();
        this.currentState = { ...this.currentState, coins };
    }

    // Das UI holt sich die Daten nur über eine Leseschnittstelle
    public getState(): UserProfileState {
        return { ...this.currentState };
    }

    private subscribeToCoinUpdates(userId: string): void {
        supabaseClient
            .channel("coin-updates")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
                (payload: RealtimePostgresChangesPayload<{ coins?: number }>) => {
                    const coins = (payload.new as { coins?: number })?.coins ?? 0;
                    this.currentState = { ...this.currentState, coins };
                }
            )
            .subscribe();
    }
}
