import { store, newId } from "../mock/store";
import type * as Real from "./wheel-repository.real";
import { INVENTORY_LIMIT } from "./wheel-repository.shared";

export const deleteWheelById: typeof Real.deleteWheelById = async (userId, wheelId) => {
    store.saved_wheels = store.saved_wheels.filter((w) => !(w.id === wheelId && w.user_id === userId));
};

export const listSavedWheels: typeof Real.listSavedWheels = async (userId) => {
    return store.saved_wheels
        .filter((w) => w.user_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
        .slice(0, INVENTORY_LIMIT)
        .map((w) => ({ id: w.id, title: w.wheel_title, link: w.url, created_at: w.created_at }));
};

export const insertSavedWheels: typeof Real.insertSavedWheels = async (userId, title, url) => {
    store.saved_wheels.push({ id: newId(), user_id: userId, wheel_title: title, url, created_at: new Date().toISOString() });
};
