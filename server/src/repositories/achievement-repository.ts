import * as real from "./achievement-repository.real";
import * as mock from "./achievement-repository.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const impl = USE_MOCK ? mock : real;

export const getAll = impl.getAll;
export const getProgress = impl.getProgress;
export const getUnlocked = impl.getUnlocked;

export type { AchievementRepository } from "./achievement-repository.shared";
