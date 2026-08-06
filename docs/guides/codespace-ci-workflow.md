# How to: Im Codespace mit CI arbeiten

Kurzer Ablauf fuer die neuen CI-Aenderungen (PR-Checks und Push-Checks), die nach Bearbeitung von **_Ticket #447_** festgehalten werden können.

## 1. Start im Codespace
- Branch von main erstellen.
- Dependencies installieren:

```bash
npm ci
npm install --ignore-scripts
```

## 2. Vor dem Push lokal pruefen
- Diese Checks sollten lokal gruen sein:

```bash
npm run lint
npm run test
npm run typecheck
npm run check:i18n
npm run build
```

## 3. PR gegen main
- PR erstellen.
- Die CI laeuft als einzelne Jobs:
  - lint
  - test
  - typecheck
  - validate-locales
  - build
- Vorteil: Man sieht direkt, welcher Check fehlschlaegt.

## 4. Was erst nach Merge passiert
- Der Job supabase-migrations laeuft nur bei push auf main.
- Im PR ist dieser Job nicht relevant.

## 5. Merge-Regel (GitHub)
- In Branch Protection/Ruleset fuer main:
  - Require status checks to pass before merging
  - Required Checks: lint, test, typecheck, validate-locales, build
- Ergebnis: Fehlerhafte PRs koennen nicht auf main gemergt werden.
