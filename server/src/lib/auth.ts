import { supabaseClient } from './supabase-client';
import type { Profile } from '../mock-store';

/**
 * Authentifiziert einen User anhand eines JWTs und gibt das Profil zurück (oder null).
 */
export async function authenticateUser(jwt: string): Promise<Profile | null> {
    if (!jwt) return null;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) return null;
    return getUserProfile(supabaseClient, user.id);
}

/**
 * Holt das User-Profil aus der Datenbank.
 */
export async function getUserProfile(supabase: any, userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error || !profile) return null;
    return profile as Profile;
}