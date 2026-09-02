import * as real from "./profile-repository.real";
import * as mock from "./profile-repository.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const impl = USE_MOCK ? mock : real;

export const getProfileByUserId = impl.getProfileByUserId;
export const getCoinsByUserId = impl.getCoinsByUserId;
export const updateCoinsByUserId = impl.updateCoinsByUserId;
export const getUserIdByUsername = impl.getUserIdByUsername;
export const isUsernameTaken = impl.isUsernameTaken;
export const insertProfile = impl.insertProfile;

export type { Profile } from "./profile-repository.shared";
