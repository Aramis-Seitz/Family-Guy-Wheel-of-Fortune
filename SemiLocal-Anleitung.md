# Teil-lokale Testumgebung einrichten

> **Ziel:** Frontend lokal bauen, Backend lokal starten, echte Supabase Test-DB nutzen — ohne den `main` Branch zu berühren.

---

## 1. Neuen Branch von main erstellen

```powershell
git checkout main
git pull
git checkout -b dein/branch 
```

---

## 2. `.env` Dateien anlegen

> ⚠️ Diese Dateien kommen **nie** in Git — prüfe dass `.env` in `.gitignore` steht.

### `api/.env`

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### `public/.env`

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

> Die Werte findest du in deinem Supabase Dashboard unter **Settings → API**.

---

## 3. Abhängigkeiten installieren

Im **Root** des Projekts ausführen:

```powershell
npm install dotenv
npm install @supabase/supabase-js --workspace api
npm install undici --workspace api
```

---

## 4. Starten — Reihenfolge ist wichtig!

### Schritt 1 — Frontend bauen

```powershell
npm run build --workspace public
```

Warten bis Vite fertig ist und `public/dist/` erstellt wurde.

### Schritt 2 — Backend starten

```powershell
npm run dev --workspace api
```

Der Server startet auf `http://localhost:3000`.

---

## 5. Im Browser aufrufen

```
http://localhost:3000/main.html
```

> ⚠️ **`/main.html` ist wichtig** — nicht `/` oder `/index.html`. Der Express Server liefert `public/dist/main.html` aus.

---

## Zusammenfassung

| Schritt | Befehl | Wo |
|---|---|---|
| Branch erstellen | `git checkout -b test/staging` | Root |
| `.env` anlegen | manuell | `api/` und `public/` |
| dotenv installieren | `npm install dotenv` | Root |
| supabase installieren | `npm install @supabase/supabase-js --workspace api` | Root |
| supabase installieren | `npm install undici --workspace api` | Root |
| Frontend bauen | `npm run build --workspace public` | Root |
| Backend starten | `npm run dev --workspace api` | Root |
| Browser öffnen | `localhost:3000/main.html` | Browser |

---

## Troubleshooting

**`dist/` nicht gefunden** → `npm run build --workspace public` nochmal ausführen

**401 Unauthorized** → `.env` in `api/` prüfen ob `SUPABASE_SERVICE_ROLE_KEY` gesetzt ist

**Seite lädt nicht** → sicherstellen dass `npm run dev --workspace api` läuft und Port 3000 frei ist

**Proxy-Fehler (ENOTFOUND)** → Proxy-Umgebungsvariablen setzen:
```powershell
$env:HTTPS_PROXY = "http://dein-proxy:port"
$env:HTTP_PROXY = "http://dein-proxy:port"
```