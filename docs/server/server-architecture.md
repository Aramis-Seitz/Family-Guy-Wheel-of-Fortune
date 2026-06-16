# Server-Architektur

## Überblick

Express.js-Server (Port 3000), deploybar auf Vercel. Statische Dateien und API-Endpunkte werden vom selben Prozess bedient.

```
public/dist/          ← Static Hosting (HTML, CSS, JS)
/api/user             ← User-Verwaltung
/api/shop             ← Shop-Käufe
/api/inventory        ← Inventar
/api/room             ← Room-System
/api/random           ← Spin starten
/api/award-coins      ← Coin-Vergabe
/api/mock/*           ← Nur wenn USE_MOCK=true
```

---

## Schichten

```
Request
   ↓
[Route]        — URL-Mapping, kein Business-Logik
   ↓
[Controller]   — Auth prüfen, Body parsen, Fehler fangen
   ↓
[Service]      — Business-Logik, Validierungen
   ↓
[Repository]   — Supabase-Abfragen
   ↓
Supabase DB
```

**Beispiel: POST /api/random**

| Schicht | Datei | Aufgabe |
|---|---|---|
| Route | `routes/spin-routes.ts` | `POST /random → handleGenerateSpin` |
| Controller | `controllers/spin-controller.ts` | JWT prüfen, Fehler wrappen |
| Service | `services/spin-service.ts` | `crypto.randomInt`, Token generieren |
| Repository | (direkt via `supabaseClient`) | Token in DB speichern |

---

## Auth-Layers

### Layer 1 — Basic-Auth-Cookie (Seiten-Gate)

Optional (aktiv wenn `AUTH_SECRET` gesetzt). Schützt HTML-Seiten (login, signup, main) vor unerlaubtem Zugriff.

```
POST /api/basic-auth { username, password }
  → prüft AUTH_USER / AUTH_PWD aus .env
  → setzt Cookie: basic_auth=<AUTH_SECRET>; HttpOnly; 8 h
```

Folgende Seiten erfordern das Cookie:
- `/login.html`
- `/main.html`
- `/signup.html`

### Layer 2 — Supabase JWT (API-Level)

Jeder API-Endpunkt ruft `resolveUserIdFromHeaders(req.headers)` auf, das das Supabase-JWT aus dem `Authorization`-Header liest und die `userId` zurückgibt. Kein gültiges JWT → `401`.

---

## Mock-Mode

```
USE_MOCK=true  →  /api/mock/* aktiviert
```

Kein Supabase nötig — in-memory Store (`mock/store.ts`). Nützlich für lokale Entwicklung ohne Supabase-Verbindung.

---

## Vercel-Deployment

```typescript
if (!process.env.VERCEL) {
  app.listen(PORT, ...);
}
export default app;  // Vercel nutzt diesen Export
```

Lokal: `app.listen(3000)`. Auf Vercel: kein `listen`, Vercel übernimmt den Import direkt.

---

## Env-Variablen

| Variable | Bedeutung |
|---|---|
| `AUTH_SECRET` | Cookie-Wert für Basic-Auth; fehlt → Gate deaktiviert |
| `AUTH_USER` / `AUTH_PWD` | Zugangsdaten für `/api/basic-auth` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase-Verbindung |
| `USE_MOCK` | `true` → Mock-Routes aktiv, kein Supabase |
| `CORS_ORIGIN` | Komma-separierte Allowed-Origins |
| `HTTPS_PROXY` | Optionaler Proxy (via undici ProxyAgent) |
