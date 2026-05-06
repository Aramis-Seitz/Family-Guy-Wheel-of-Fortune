# Lokales Testing

Diese Anleitung erklärt wie du die Family-Guy Wheel of Fortune App lokal testen kannst — ohne echte Supabase-Verbindung.

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

---

## Mock-Modus starten

### Schritt 1 — Umgebungsvariablen setzen

**`api/.env`** anlegen:
```
USE_MOCK=true
```

**`public/.env`** anlegen:
```
VITE_USE_MOCK=true
```

> ⚠️ Diese Dateien kommen **nie** in Git — `.env` ist in `.gitignore` eingetragen.

### Schritt 2 — Backend starten

Im `api/` Ordner:
```powershell
cd api
npm run dev
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
http://localhost:5173/login.html
```

> ⚠️ **`/login.html` ist wichtig** — direkt auf die Login-Seite gehen.

### Schritt 5 — Einloggen

Mit den Mock-Zugangsdaten anmelden:
```
Benutzername: admin
Passwort:     admin
```

Danach landet man automatisch auf der Wheel-Seite.

---

## Was der Mock kann — und was nicht

| Funktion | Mock-Modus | Produktion |
|---|---|---|
| Rad drehen | ✅ | ✅ |
| Coins vergeben | ✅ (in-memory) | ✅ (Supabase) |
| Login / Signup | ✅ (admin/admin) | ✅ (echte Auth) |
| Daten nach Neustart | ❌ gehen verloren | ✅ persistent |
| Echte JWT Tokens | ❌ | ✅ |

---

## Zurück auf Supabase wechseln

Flags in beiden `.env` Dateien auf `false` setzen:

**`api/.env`:**
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