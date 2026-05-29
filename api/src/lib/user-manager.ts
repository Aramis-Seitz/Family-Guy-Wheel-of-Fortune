import { supabaseClient } from "./supabase-client.js";
import type { Session } from "@supabase/supabase-js";
import type { ProfileData } from "../../../shared/types.js";

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
            this.profile = await this.fetchUserProfile(this.session.user.id);
            this.coins = this.profile?.coins ?? 0;
        }
        this.initialized = true;
    }

    async fetchCurrentSession(): Promise<Session | null> {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session?.user) return null;
        return session;
    }

    async fetchUserProfile(userId: string): Promise<ProfileData | null> {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("username, coins")
            .eq("id", userId)
            .single();
        if (error || !data) return null;
        return data;
    }

    async getSession(): Promise<Session | null> {
        if (!this.initialized) await this.init();
        return this.session;
    }

    async getProfile(): Promise<ProfileData | null> {
        if (!this.initialized) await this.init();
        return this.profile;
    }

    async getCoins(): Promise<number> {
        if (!this.initialized) await this.init();
        return this.coins;
    }

    async setCoins(newBalance: number): Promise<void> {
        if (!this.session) throw new Error("User not authenticated");
        const userId = this.session.user.id;
        const { error } = await supabaseClient
            .from("profiles")
            .update({ coins: newBalance })
            .eq("id", userId);
        if (error) throw error;
        this.coins = newBalance;
    }

    async subtractCoins(amount: number): Promise<void> {
        const currentCoins = await this.getCoins();
        if (currentCoins < amount) throw new Error("Not enough coins");
        await this.setCoins(currentCoins - amount);
    }


    async signOut() {
        await supabaseClient.auth.signOut();
        this.session = null;
        this.profile = null;
        this.coins = 0;
        this.initialized = false;
    }
}

export const userManager = new UserManager();
