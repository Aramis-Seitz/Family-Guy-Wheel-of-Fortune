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

export const getUserIdByUsername: typeof Real.getUserIdByUsername = async (username) => {
    const profile = store.profiles.find((p) => p.username === username);
    return profile?.id ?? null;
};

export const insertProfile: typeof Real.insertProfile = async (userId, username, email, dateOfBirth) => {
    if (store.profiles.some((p) => p.id === userId)) {
        throw { message: "duplicate key value violates unique constraint", code: "23505" };
    }
    store.profiles.push({ id: userId, username, email, date_of_birth: dateOfBirth, coins: 1 });
};
