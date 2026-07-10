# How to: ESLint

## Was ist das

ESLint prüft TypeScript-Code statisch auf Bugs und Stilverstöße, bevor er in den Review geht. Konfiguriert ist die `recommended`-Regel-Sammlung aus `typescript-eslint`.

## Setup

Läuft automatisch mit `npm install` im Root — keine zusätzliche Installation nötig. Die Config liegt zentral in [`eslint.config.js`](../../eslint.config.js) und gilt für alle drei Workspaces (`public`, `server`, `shared`).

## Benutzung

```bash
npm run lint
```

Prüft alle `.ts`/`.tsx`-Dateien im Projekt.

```bash
npx eslint . --fix
```

Behebt automatisch behebbare Verstöße (z. B. `let` → `const`).

**Editor-Integration (empfohlen):** VS-Code-Extension **ESLint** (`dbaeumer.vscode-eslint`) installieren — zeigt Verstöße live im Editor, erkennt die Flat Config automatisch.

## Was ihr beachten müsst

- **Kein `any`** (`no-explicit-any`)
- **Keine ungenutzten Variablen/Imports/Parameter** (`no-unused-vars`) — nicht gebrauchte Parameter mit `_` prefixen (z. B. `_req`), wenn die Signatur sie trotzdem verlangt
- **`const` statt `let`**, wenn die Variable nie neu zugewiesen wird
- **Keine stehengelassenen Ausdrücke ohne Effekt** (`no-unused-expressions`) — z. B. eine Zeile, die nur ein Objekt referenziert, ohne es zu verwenden. Ternarys mit Seiteneffekt (`cond ? doA() : doB();`) sind bei uns per `allowTernary: true` erlaubt

`npm run lint` sollte vor jedem PR fehlerfrei durchlaufen. Bestehende Fehler in Altcode werden schrittweise nachgezogen, nicht in einem großen Rutsch.

**Achtung, aktueller Stand:** `npm run lint` ist noch **nicht** in die CI-Pipeline ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)) eingebunden und es gibt keinen Pre-Commit-Hook. Errors blockieren also aktuell weder `npm run build`, `dev` noch einen Merge — sie fallen nur auf, wenn man `npm run lint` manuell ausführt oder die Editor-Extension installiert hat. Bis ein Lint-Step in der CI ergänzt ist, liegt es an jedem selbst, vor dem PR zu linten.

## Regel anpassen oder ausnehmen

Neue/geänderte Regeln kommen in den `rules`-Block in `eslint.config.js`. Einzelne Zeilen können in Ausnahmefällen mit einem Kommentar direkt darüber ausgenommen werden — **mit Begründung**:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase liefert hier keinen generierten Typ
```
