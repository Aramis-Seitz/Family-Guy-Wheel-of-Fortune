"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecureRandomNumber = getSecureRandomNumber;
const crypto_1 = __importDefault(require("crypto"));
function getSecureRandomNumber(min, max) {
    return crypto_1.default.randomInt(min, max + 1);
}
