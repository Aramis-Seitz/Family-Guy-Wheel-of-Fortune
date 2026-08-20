import { store } from "../mock/store";
import type * as Real from "./profile-repository.real";

function notFoundError() {
    return { message: "Row not found", code: "PGRST116" };
}

export const getProfileByUserId: typeof Real.getProfileByUserId = async (userId) => {
    const profile = store.profiles.find((p) => p.id === userId);
    if (!profile) return null;
    return { username: profile.username, coins: profile.coins };
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

export const insertProfile: typeof Real.insertProfile = async (userId, username, email, dateOfBirth) => {
    // Im Mock legt /api/mock/auth/signup die profiles-Row schon direkt an
    // (dort liegt auch das Passwort fürs Mock-Login) - dieser Aufruf hier
    // kommt danach trotzdem vom selben zweistufigen Frontend-Flow wie in
    // Produktion und muss deshalb ein no-op statt ein Fehler sein.
    if (store.profiles.some((p) => p.id === userId)) return;
    store.profiles.push({ id: userId, username, email, date_of_birth: dateOfBirth, password: "", coins: 1 });
};
