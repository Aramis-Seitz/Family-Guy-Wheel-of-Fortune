import { store } from "../mock/store";
import type * as Real from "./profile-repository.real";
import { parseDisplayName } from "../lib/display-name";

function notFoundError() {
    return { message: "Row not found", code: "PGRST116" };
}

export const getProfileByUserId: typeof Real.getProfileByUserId = async (userId) => {
    const profile = store.profiles.find((p) => p.id === userId);
    if (!profile) return null;
    return { username: profile.username, suffix: profile.suffix, coins: profile.coins };
};

export const getCoinsByUserId: typeof Real.getCoinsByUserId = async (userId) => {
    const profile = store.profiles.find((p) => p.id === userId);
    if (!profile) throw notFoundError();
    return profile.coins;
};

export const updateCoinsByUserId: typeof Real.updateCoinsByUserId = async (userId, coins) => {
    const profile = store.profiles.find((p) => p.id === userId);
    if (profile) profile.coins = coins;
};

export const getUserIdByUsername: typeof Real.getUserIdByUsername = async (displayName) => {
    const parsed = parseDisplayName(displayName);
    if (!parsed) return null;
    const profile = store.profiles.find((p) =>
        p.username.toLowerCase() === parsed.username.toLowerCase() && p.suffix === parsed.suffix
    );
    return profile?.id ?? null;
};

function nextFreeSuffix(username: string): number {
    const takenSuffixes = store.profiles
        .filter((p) => p.username.toLowerCase() === username.toLowerCase())
        .map((p) => p.suffix);
    return takenSuffixes.length === 0 ? 0 : Math.max(...takenSuffixes) + 1;
}

export const isUsernameTaken: typeof Real.isUsernameTaken = async (username) => {
    const normalizedUsername = username.trim().toLowerCase();

    return store.profiles.some(
        (profile) => profile.username.trim().toLowerCase() === normalizedUsername
    );
};

export const insertProfile: typeof Real.insertProfile = async (userId, username, email, dateOfBirth) => {
    // Im Mock legt /api/mock/auth/signup die profiles-Row schon direkt an
    // (dort liegt auch das Passwort fürs Mock-Login) - dieser Aufruf hier
    // kommt danach trotzdem vom selben zweistufigen Frontend-Flow wie in
    // Produktion und muss deshalb ein no-op statt ein Fehler sein.
    if (store.profiles.some((p) => p.id === userId)) return;
    store.profiles.push({ id: userId, username, suffix: nextFreeSuffix(username), email, date_of_birth: dateOfBirth, password: "", coins: 1 });
};
