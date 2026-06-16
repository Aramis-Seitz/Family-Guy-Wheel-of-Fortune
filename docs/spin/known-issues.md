# Bekannte Probleme — Spin-System

## Offen

### 1. Circular Dependency: `spin.ts` ↔ `winner.ts`

`spin.ts` importiert aus `winner.ts` (`announceWinner`, `resolveWinner`) und `winner.ts` importiert aus `spin.ts` (`unlockSpinButtons`). TypeScript/ESM kompiliert das aktuell ohne Fehler, aber der gegenseitige Import ist ein Design-Smell und kann bei bestimmten Bundler-Konfigurationen zu Problemen führen.

**Lösung:** Gemeinsam genutzte Abhängigkeiten (z. B. `unlockSpinButtons`) in ein separates Modul (`spin-controls.ts`) auslagern.

---

### 2. Room-Spin: Falsche Zufallszahl-Range

`room-service.ts: spinRoom` nutzt noch `randomInt(140, 901)` statt `randomInt(0, 359)`. Das ist derselbe Bug, der für Solo-Spins bereits in `spin-service.ts` behoben wurde. Room-Spins landen daher nicht gleichmäßig verteilt.

---

### 3. Guest-Spin: Kein Server-seitiges Winner-Verify

Der Guest berechnet den Gewinner lokal anhand des `last_spin`-Werts. Es gibt keine serverseitige Verifizierung für Guests — nur der Host erhält einen `spinToken` und die eigentliche Coin-Vergabe läuft nur für den Host.

---

### 4. Guest-Spin: Richtung immer `'right'`

```typescript
spinWheel(totalSteps, 'right', '', names);
```

Die Spin-Richtung ist für Guests fest auf `'right'` kodiert, unabhängig davon, was der Host gewählt hat. Das führt zu unterschiedlichen Animationen bei Host und Guest (visuell kein Bug, semantisch inkonsistent).

---

### 5. `source.start(ctx.currentTime)` ohne Lookahead

In manchen Browsern kann `source.start(ctx.currentTime)` eine stille Warning erzeugen, wenn JS-Scheduling leicht hinter dem Audio-Thread hängt. Robuster:

```typescript
source.start(ctx.currentTime + 0.001);
```

---

### 6. Keine Test-Abdeckung für Spin-Logik

`resolveWinner`, `hasEnteredNewSegment`, `runSpinFrame` und die Velocity-Berechnung sind nicht automatisiert getestet. Nur `random.ts` hat einen Unit-Test.

---

### 7. Hardcodierter Zeiger-Offset

```typescript
const POINTER_OFFSET_DEG = 270;
```

Der Offset ist auf 270° fixiert und setzt voraus, dass der Zeiger oben (12-Uhr-Position) sitzt. Änderungen am Wheel-Layout (z. B. Zeiger rechts) erfordern eine Anpassung dieser Konstante.
