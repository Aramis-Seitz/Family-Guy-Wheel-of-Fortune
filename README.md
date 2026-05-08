# Family Guy Wheel of Fortune

Eine Fullstack-App mit einem drehbaren Glücksrad — Express-Backend (TypeScript) + Vite-Frontend (TypeScript), verbunden über Supabase.

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

## Projekt einrichten (Erstinstallation)

### 1. Repository klonen

```powershell
git clone <repo-url>
cd Family-Guy-Wheel-of-Fortune
```

### 2. Abhängigkeiten installieren

Einmalig im **Root-Verzeichnis** ausführen — installiert alle Workspaces (`api` + `public`):

```powershell
npm install
```

### 3. Umgebungsvariablen anlegen

> Diese Dateien kommen **nie** in Git — sie sind in `.gitignore` eingetragen.

**`api/.env`** anlegen:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
USE_MOCK=false
```

**`public/.env`** anlegen:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_USE_MOCK=false
```

> Die Werte findest du im Supabase Dashboard unter **Settings → API**. Frag im Team nach den Zugangsdaten.

### 4. Fertig

Für Code bearbeitung neunen Branche eröffnen.
```
Der Main-Branch Hostet die Produktive version des Codes auf Vercel, wo diese auch direkt deployed wird.
```


---

## Proxy (nur im Telekom-Netz)

Falls Supabase nicht erreichbar ist, Proxy-Variablen vor dem Start setzen:

```powershell
$env:HTTPS_PROXY = "http://sia-lb.telekom.de:8080"
$env:HTTP_PROXY  = "http://sia-lb.telekom.de:8080"
```

---

## Projektstruktur

```
/
├── api/        # Express-Backend (TypeScript) — Port 3000
├── public/     # Vite-Frontend (TypeScript)
└── package.json  # Root-Workspace (verwaltet api + public)
```

---

## Lokales Testing

Es gibt zwei Testmodi je nachdem ob Supabase erreichbar ist oder nicht.

### Semi-lokales Testing (mit Test-Supabase-DB)

Verbindung läuft gegen eine echte Supabase-Instanz, aber eine dedizierte Test-DB — kein Produktivdaten-Risiko.

→ Anleitung: [SemiLocal-Anleitung.md](./SemiLocal-Anleitung.md)

### Komplett lokales Testing (kein Supabase, In-Memory-DB)

Kein Netzwerk, kein Supabase nötig. Daten leben nur im Arbeitsspeicher und sind nach Neustart weg.

→ Anleitung: [CompleteLocal.md](./CompleteLocal.md)
