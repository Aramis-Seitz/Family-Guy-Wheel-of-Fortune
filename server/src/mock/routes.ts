import { Router } from "express";
import { randomUUID } from "crypto";
import { store, appendChatMessage, getChatMessagesSince } from "./store";
import { encodeMockJwt } from "./jwt";

export const mockRouter = Router();

// --- Auth -------------------------------------------------------------
// Ersetzt Supabase Auth (auth.users). Legt bewusst KEIN profiles-Row an —
// genau wie in Produktion passiert das erst über POST /api/user/register
// (siehe registerUser in user-service.ts), damit der Mock denselben
// zweistufigen Signup-Flow abbildet.

mockRouter.post("/auth/signup", (req, res) => {
    const { email, password, username, date_of_birth } = req.body ?? {};

    if (!email || !password || !username) {
        res.status(400).json({ error: "email, password und username erforderlich" });
        return;
    }

    if (store.authUsers.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
        res.status(400).json({ error: "Diese E-Mail ist bereits registriert" });
        return;
    }

    const id = randomUUID();
    const dob = date_of_birth ?? null;
    store.authUsers.push({ id, email, username, password, date_of_birth: dob });

    const token = encodeMockJwt({ id, email, username, date_of_birth: dob });
    res.json({ token, user: { id, email, user_metadata: { username, date_of_birth: dob } } });
});

mockRouter.post("/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};

    const user = store.authUsers.find((u) => u.email.toLowerCase() === String(email ?? "").toLowerCase());
    if (!user || user.password !== password) {
        res.status(401).json({ error: "Ungültige E-Mail oder Passwort" });
        return;
    }

    const token = encodeMockJwt({ id: user.id, email: user.email, username: user.username, date_of_birth: user.date_of_birth });
    res.json({
        token,
        user: { id: user.id, email: user.email, user_metadata: { username: user.username, date_of_birth: user.date_of_birth } },
    });
});

// --- Realtime -----------------------------------------------------------
// Supabase Realtime (postgres_changes/broadcast) gibt es im Mock nicht.
// Der Frontend-Mock-Client pollt diese Endpunkte stattdessen, um Room- und
// Chat-Updates zwischen mehreren Tabs/Browsern zu simulieren.

mockRouter.get("/realtime/rooms/:roomKey", (req, res) => {
    const room = store.rooms.find((r) => r.room_key === req.params.roomKey);
    if (!room) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json({
        players: room.players,
        names_in_wheel: room.names_in_wheel,
        last_spin: room.last_spin,
        spun_at: room.spun_at,
        multiplier: room.multiplier,
        spin_direction: room.spin_direction,
        wheel_reset_at: room.wheel_reset_at,
        winner_modal_close_at: room.winner_modal_close_at,
    });
});

mockRouter.get("/realtime/chat/:roomKey", (req, res) => {
    const since = Number(req.query.since ?? 0) || 0;
    res.json(getChatMessagesSince(req.params.roomKey, since));
});

mockRouter.post("/realtime/chat/:roomKey", (req, res) => {
    const { event, payload } = req.body ?? {};
    if (!event || payload === undefined) {
        res.status(400).json({ error: "event und payload erforderlich" });
        return;
    }
    const msg = appendChatMessage(req.params.roomKey, event, payload);
    res.json(msg);
});
