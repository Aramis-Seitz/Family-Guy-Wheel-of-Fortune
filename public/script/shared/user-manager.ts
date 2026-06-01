import { supabaseClient } from "./supabase-client.js";
import { getUserCoins, getUserProfile, setUserCoins, subtractUserCoins } from "../api/user.js";
import type { Session } from "@supabase/supabase-js";
import type { ProfileData } from "./types.js";

/**
 * Central user store for session, profile, coins, and auth logic.
 * All user-related data and logic should be accessed via this module.
 */

class UserManager {
    private session: Session | null = null;
    private profile: ProfileData | null = null;
    private coins: number = 0;
    private initialized = false;

    async init() {
        if (this.initialized) return;
        this.session = await this.fetchCurrentSession();
        if (this.session) {
            this.profile = await getUserProfile();
            this.coins = this.profile?.coins ?? 0;
        }
        this.initialized = true;
    }

    async signIn(email: string, password: string): Promise<void> {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await this.init();
    }

    async signOut() {
        await supabaseClient.auth.signOut();
        this.session = null;
        this.profile = null;
        this.coins = 0;
        this.initialized = false;
    }

    async fetchCurrentSession(): Promise<Session | null> {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session?.user) return null;
        return session;
    }

    async getSession(): Promise<Session | null> {
        if (!this.initialized) await this.init();
        return this.session;
    }

    async getProfile(): Promise<ProfileData | null> {
        if (!this.initialized) await this.init();
        if (!this.session) return null;

        const profile = await getUserProfile();
        this.profile = profile;
        if (profile) this.coins = profile.coins ?? this.coins;

        return this.profile;
    }

    async getCoins(): Promise<number> {
        if (!this.initialized) await this.init();
        if (!this.session) return 0;
        const coins = await getUserCoins();
        this.coins = coins;
        return coins;
    }

    async setCoins(newBalance: number): Promise<void> {
        if (!this.session) throw new Error("User not authenticated");
        const updatedCoins = await setUserCoins(newBalance);
        this.coins = updatedCoins;
    }

    async subtractCoins(amount: number): Promise<void> {
        if (!this.session) throw new Error("User not authenticated");
        const updatedCoins = await subtractUserCoins(amount);
        this.coins = updatedCoins;
    }

    /*
    subscribeToCoins(callback: (coins: number) => void): void {
        supabaseClient.channel("coin-updates").on(...)
            .subscribe();  // ← liefert nur Daten, kein DOM
    }
    */
}

export const userManager = new UserManager();
