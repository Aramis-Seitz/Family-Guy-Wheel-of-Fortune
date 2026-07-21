"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinRoomResponseSchema = exports.CreateRoomResponseSchema = void 0;
const zod_1 = require("zod");
exports.CreateRoomResponseSchema = zod_1.z.object({
    roomKey: zod_1.z.string(),
    players: zod_1.z.array(zod_1.z.string()),
    names: zod_1.z.array(zod_1.z.string()),
});
exports.JoinRoomResponseSchema = zod_1.z.object({
    players: zod_1.z.array(zod_1.z.string()),
    multiplier: zod_1.z.number(),
    names: zod_1.z.array(zod_1.z.string()),
    hostName: zod_1.z.string(),
});
