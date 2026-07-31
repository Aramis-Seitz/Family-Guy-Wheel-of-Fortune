import * as real from "./wheel-repository.real";
import * as mock from "./wheel-repository.mock";

const USE_MOCK = process.env.USE_MOCK === "true";
const impl = USE_MOCK ? mock : real;

export const deleteWheelById = impl.deleteWheelById;
export const listSavedWheels = impl.listSavedWheels;
export const insertSavedWheels = impl.insertSavedWheels;

export { INVENTORY_LIMIT } from "./wheel-repository.shared";
