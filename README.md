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
cd <repo-name>
```

### 2. Abhängigkeiten installieren

Einmalig im **Root-Verzeichnis** ausführen — installiert alle Workspaces (`api` + `public`):

```powershell
npm install
```

### 3. Umgebungsvariablen anlegen

> Diese Dateien kommen **nie** in Git — sie sind in `.gitignore` eingetragen.

**`server/.env`** anlegen:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
USE_MOCK=false
CORS_ORIGIN=http://localhost:5173
```

**`public/.env`** anlegen:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:3000
```

> Die Werte findest du im Supabase Dashboard unter **Settings → API**. Frag im Team nach den Zugangsdaten.

### 4. Fertig

Für die Entwicklung einen neuen Branch von `main` erstellen.


---

## Projektstruktur

```
/
├── server/     # Express-Backend (TypeScript) — Port 3000
├── public/     # Vite-Frontend (TypeScript)
├── api/        # Vercel-Adapter (re-exportiert server/)
└── package.json  # Root-Workspace (verwaltet server + public)
```

---

## Lokales Testing

Zwei Modi zum lokalen Testen — je nachdem ob Supabase erreichbar ist:

- **Semi-lokal** (mit Test-Supabase-DB) — [Anleitung](./docs/setup/semi-local.md)
- **Komplett lokal** (In-Memory-DB, kein Netzwerk) — [Anleitung](./docs/setup/complete-local.md)

---

## Spieldesign-Dokumentation

## Kontext

### Zugang und Account

- Voraussetzung, um die Webapp nutzen zu können, ist ein registrierter Account.
- Um sich anzumelden, muss man erst einen Account per Registrierung erstellen.

### Grundprinzip des Glücksrads

- Die Webapp ist ein digitales Glücksrad, bei dem ein Spieler Namen eingeben kann.
- Wenn das Rad gedreht wird, wird ein Name nach Gleichverteilung (gleiche Wahrscheinlichkeiten) ausgewählt.
- Der Zeiger zeigt somit am Ende der Drehanimation auf das Segment des Namens, der gewonnen hat.

### Sound und Companion

- Bei jedem Überschreiten eines Segments wird ein TickSound (Sound) abgespielt.
- Links neben dem Glücksrad kann man einen Begleiter sehen (Companion). Der Companion stellt den Zeiger des Glücksrads dar.
- Sound und Companion kann man im Spiel austauschen (siehe Shop und Inventar).

### Shop und Inventar

- Im Shop kann man die Assets mit einer fiktiven Währung (Coins), welche man durchs Spielen erhält (siehe Wirtschaft), erwerben.
- Der Preis hängt von der Einschätzung der Entwickler ab, wie besonders ein Asset ist. Sounds sind günstiger (10-50 Coins), Companions sind teurer (40-150 Coins).
- Assets, die man im Shop gekauft hat, kann man im Inventar aktivieren.

### Multiplayer

- Es gibt einen Multiplayer. Beim Multiplayer kann man einen Raum erstellen.
- Über einen Beitrittscode können andere registrierte Spieler (Gäste) am Spiel teilnehmen.
- Der Spieler, der den Raum erstellt, wird als Host bezeichnet.
- Der Host kann den Raum jederzeit beenden. Gäste können den Raum jederzeit verlassen.
- Im Multiplayer werden alle Usernames der Spieler im Raum angezeigt. Pro User steht der Username einmal im Rad. Beispiel: Bei 5 Spielern stehen 5 Namen im Rad.
- Man kann keine Namen manuell in das Rad eintragen oder entfernen.
- Wenn ein Gast den Raum betritt oder verlässt, wird das Rad automatisch aktualisiert.
- Wenn der Host den Raum verlässt, wird der Raum geschlossen und alle Teilnehmer des Raums werden auf den Singleplayer weitergeleitet.
- Während sich das Rad dreht, kann kein Spieler des Raums den Raum verlassen.
- Nur der Host kann das Rad drehen

## Wirtschaft

- Die Währung im Spiel heißt Coins und ist fiktiv. Die Entwickler haben das Coinssystem frei erfunden.

**Singleplayer:**
- Wenn man das Rad dreht, erhält man nach Gleichverteilung 1-3 Coins.
- Wenn man dreht und ein Name gewinnt, zu dem es einen registrierten Username gibt, erhält dieser User nach Gleichverteilung 3-6 Coins.

**Multiplayer:**
- Der Host erhält beim Drehen nach Gleichverteilung 1-3 Coins.
- Der User, der gewinnt, erhält nach Gleichverteilung 3-6 Coins.

## UI

- Assets, welche man im Inventar aktiviert hat, gelten im Singleplayer sowie im Multiplayer (für einen selbst). Assets, die man gekauft hat, möchte man auch nutzen können.
- Während des Drehens sind Inventar und Shop verfügbar. Das hat keinen Einfluss auf die Spielmechanik.