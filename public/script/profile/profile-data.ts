import { supabaseClient } from "../shared/supabase-client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getUserProfile, getUserCoins, ensureDefaultAssets as ensureDefaultAssetsApi } from "./user-api";

export interface UserProfileState {
    username: string | null;
    coins: number;
    isAuthenticated: boolean;
}

type ProfileDataListener = (state: UserProfileState) => void;

export class ProfileData {
    private currentState: UserProfileState = {
        username: null,
        coins: 0,
        isAuthenticated: false,
    };
    private listeners = new Set<ProfileDataListener>();

    public async initializeProfile(): Promise<void> {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session?.user) {
            this.setState({ username: null, coins: 0, isAuthenticated: false });
            return;
        }

        const profile = await getUserProfile();
        this.setState({
            username: profile?.username ?? null,
            coins: profile?.coins ?? 0,
            isAuthenticated: true,
        });

        this.subscribeToCoinUpdates(session.user.id);
    }

    public async refreshCoins(): Promise<void> {
        const coins = await getUserCoins();
        this.setState({ ...this.currentState, coins });
    }

    public async signOut(): Promise<void> {
        await supabaseClient.auth.signOut();
        this.setState({ username: null, coins: 0, isAuthenticated: false });
    }

    public async ensureDefaultAssets(): Promise<void> {
        await ensureDefaultAssetsApi();
    }

    public getState(): UserProfileState {
        return { ...this.currentState };
    }

    public subscribe(listener: ProfileDataListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private setState(newState: UserProfileState): void {
        this.currentState = newState;
        this.listeners.forEach((listener) => listener(this.getState()));
    }

    private subscribeToCoinUpdates(userId: string): void {
        supabaseClient
            .channel("coin-updates")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
                (payload: RealtimePostgresChangesPayload<{ coins?: number }>) => {
                    const coins = (payload.new as { coins?: number })?.coins ?? 0;
                    this.setState({ ...this.currentState, coins });
                }
            )
            .subscribe();
    }
}

export const profileData = new ProfileData();
