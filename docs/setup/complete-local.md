# Lokales Testing

Diese Anleitung erklärt wie du die Family-Guy Wheel of Fortune App lokal testen kannst — ohne echte Supabase-Verbindung.

Der Mock läuft komplett in-memory im Node-Prozess des Servers (`server/src/mock/*`). Er bildet dieselben Tabellen nach wie `supabase/migrations/` (profiles, rooms, spin_tokens, saved_wheels, asset, asset_ownership, asset_selection) und wird von allen Repositories transparent anstelle des echten Supabase-Clients verwendet — der restliche Code (Controller, Services, Repositories, Frontend) merkt nichts vom Unterschied.

---

## Voraussetzungen

- **Node.js** v22 oder höher
- **npm** v10 oder höher

Version prüfen:
```powershell
node --version
npm --version
```

---

## Setup

Einmalig im **Root-Verzeichnis** ausführen:

```powershell
npm install
```

> Baut dabei automatisch das `shared`-Package (geteilte Zod-Schemas/Typen für server + public). Falls du später Änderungen in `shared/src/*.ts` machst, musst du `npm run build --workspace shared` manuell erneut ausführen — es gibt keinen Watch-Modus.

---

## Mock-Modus starten

### Schritt 1 — Umgebungsvariablen setzen

**`server/.env`** anlegen:
```
USE_MOCK=true
```

**`public/.env`** anlegen:
```
VITE_USE_MOCK=true
```

> ⚠️ Diese Dateien kommen **nie** in Git — `.env` ist in `.gitignore` eingetragen.

### Schritt 2 — Backend starten

Im **Root-Verzeichnis**:
```powershell
npm run dev --workspace server
```

### Schritt 3 — Frontend starten

In einem **zweiten Terminal** im `public/` Ordner:
```powershell
cd public
npm run dev
```

### Schritt 4 — Browser öffnen

Auf die URL die Vite anzeigt gehen — meistens:
```
http://localhost:5173/html/login.html
```

> ⚠️ **`/html/login.html`** — direkt auf die Login-Seite gehen. Der `html/`-Teil im Pfad ist im Dev-Modus (Vite, Port 5173) nötig, weil Vite die echte Ordnerstruktur aus `public/html/` widerspiegelt. Im gebauten/produktiven Modus (Port 3000, `express.static` aus `public/dist/html`) entfällt das Präfix und es heißt nur `/login.html`.

### Schritt 5 — Einloggen

Der Login läuft über **E-Mail**, nicht über den Benutzernamen. Mit dem vorangelegten Mock-Testaccount anmelden:
```
E-Mail:    admin@admin.de
Passwort:  admin
```

Danach landet man automatisch auf der Wheel-Seite. Der Account startet mit 100 Coins und hat den Sound "Peter Laugh" sowie den Companion "Quagmire" (die Standard-Assets) bereits ausgewählt.

Alternativ kannst du auch über `/signup.html` einen neuen Account anlegen — der komplette Signup→Register-Flow (Supabase-Auth-Signup + `/api/user/register`) ist im Mock genauso zweistufig wie in Produktion.

---

## Was der Mock kann — und was nicht

| Funktion | Mock-Modus | Produktion |
|---|---|---|
| Rad drehen, Coins vergeben | ✅ (in-memory) | ✅ (Supabase) |
| Login / Signup | ✅ (eigene Test-Accounts anlegbar) | ✅ (echte Auth) |
| Shop, Inventory, gespeicherte Wheels | ✅ | ✅ |
| Multiplayer-Räume (erstellen/beitreten/spinnen) | ✅ | ✅ |
| Realtime-Sync zwischen Tabs/Browsern | ✅ per Polling (~0,7s Verzögerung) | ✅ sofort (Supabase Realtime) |
| Chat im Raum | ✅ per Polling | ✅ sofort (Broadcast) |
| Daten nach Server-Neustart | ❌ gehen verloren (in-memory) | ✅ persistent |
| Echte JWT Tokens | ❌ (Base64-Mock-Token) | ✅ |

**Multiplayer lokal testen:** Zwei Browser-Tabs/-Fenster gegen denselben laufenden Server öffnen (z. B. zwei Vite-Tabs, oder ein Tab im Inkognito-Fenster für den zweiten Account) — einen Raum erstellen, mit dem Room-Key im zweiten Tab beitreten. Da beide Clients denselben Node-Prozess als gemeinsamen Zustand nutzen, funktioniert das auch über verschiedene Rechner im selben Netzwerk (IP statt `localhost` verwenden).

---

## Zurück auf Supabase wechseln

Flags in beiden `.env` Dateien auf `false` setzen:

**`server/.env`:**
```
USE_MOCK=false
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**`public/.env`:**
```
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

Dann beide Server neu starten.

---

## Proxy-Hinweis (nur im Telekom-Netz relevant)

Im **Mock-Modus** wird kein externer Traffic gemacht — der Proxy wird komplett ignoriert.

Im **Supabase-Modus** muss der Proxy gesetzt sein:

```powershell
$env:HTTPS_PROXY = "http://proxy.telekom.de:port"
$env:HTTP_PROXY = "http://proxy.telekom.de:port"
```

> Falls dein System ohnehin globale `HTTP_PROXY`/`HTTPS_PROXY`-Variablen gesetzt hat (z. B. per Firmen-Policy), fängt der Proxy sonst auch `localhost`-Requests ab — das betrifft auch eigene Tests mit `curl` gegen den lokalen Server (`curl --noproxy '*' ...`).

---

## Troubleshooting

**`{"error":"Unauthorized"}` bei jedem Request** → Prüfen, ob im Frontend wirklich eingeloggt wurde (Bearer-Token wird aus der Supabase-Session gelesen) und ob `server/.env` wirklich `USE_MOCK=true` gesetzt hat — sonst versucht der Server, sich mit einem echten (fehlenden) Supabase-Projekt zu verbinden und startet gar nicht erst.

**Daten sind nach Neustart weg** → Erwartetes Verhalten, der Mock hält alles nur im Arbeitsspeicher des Server-Prozesses (siehe Tabelle oben).

**Multiplayer-Sync reagiert erst nach ~1 Sekunde** → Erwartetes Verhalten des Polling-Mocks, keine Fehlfunktion.
