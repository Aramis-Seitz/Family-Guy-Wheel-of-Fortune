# Wheel-Spinning Architektur

## Module

| Modul | Verantwortung |
|---|---|
| `wheel/spin.ts` | rAF-Animationsloop, Button-Lock, Reset |
| `wheel/multiplier.ts` | Multiplier-Slider: lesen, setzen, anzeigen |
| `wheel/renderer.ts` | SVG-Generierung (einmalig beim Namen-Update) |
| `wheel/winner-logic.ts` | `getSegmentIndex()` für den Tick-Sound — keine DOM-Abhängigkeit. Den Gewinner bestimmt der Server. |
| `wheel/winner.ts` | Modal, Confetti, Coin-Vergabe (Anzeige des vom Server gelieferten Namens) |
| `wheel/sound.ts` | Web Audio API: Tick, Drumroll, Cymbal, Asset-Sound |
| `api/client-api.ts` | `/api/random` (Landungswinkel holen), `/api/award-coins` |
| `server/lib/wheel-winner.ts` | Serverseitige Gewinner-Bestimmung: `getSegmentIndex()` + `resolveSpinWinner()` |

---

## Datenfluss

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
│           spinLeftBtn / spinRightBtn  →  initWheelControls()    │
└──────────────────────────┬──────────────────────────────────────┘
                           │  click event
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                spin.ts: spinWheelWithRandomSteps()              │
│  1. lockSpinButtons()                                           │
│  2. names = getNames()  ← Snapshot für diesen Spin              │
│  3. requestSpin(names, currentRotation, dir, multiplier)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  POST /api/spins
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Server: generateSpin()                             │
│  rawSteps = crypto.randomInt(0, 359)   ← roher Landungswinkel   │
│  resolveSpinWinner(rawSteps, multiplier, direction, segmentCount)│
│    → winnerIndex  (Zeiger bei 270°, Abstand zur Segmentgrenze)  │
│    → ggf. leicht verschobener Landungswinkel                    │
│  spinToken = randomUUID()  → mit winnerIndex + Rad in DB        │
│  ← { ranNum: rawSteps, spinToken, winnerName }                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              spin.ts: spinWheel()                               │
│  totalSteps = round(1800 × multiplier) + rawSteps               │
│            ↑ Mindestumdrehungen       ↑ Landungswinkel          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          requestAnimationFrame-Loop: runSpinFrame()             │
│                                                                 │
│  PHASE 1 (0–15%):   velocity = 15°/frame  (Vollgas)             │
│  PHASE 2 (15–100%): ease-out, Exponent 1.4 → 0.5°/frame         │
│                                                                 │
│  pro Frame:                                                     │
│    currentRotation += velocity × sign                           │
│    CSS transform: rotate(Xdeg)                                  │
│    hasEnteredNewSegment()? → playTickSound()                    │
│    distanceTravelled > totalSteps − 321? → playDrumRoll()       │
│    distanceTravelled ≥ totalSteps? → finishSpin()               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                winner.ts: announceWinner()                      │
│  winnerName = config.winnerName   ← vom Server geliefert        │
│  → Modal anzeigen, Confetti                                     │
│  → POST /api/spins/:spinToken/award   (nur der Token!)          │
│      Server liest winnerIndex aus dem Spin-Token und bucht      │
└─────────────────────────────────────────────────────────────────┘
```

Der Client rechnet den Gewinner **nicht** mehr selbst aus. `getSegmentIndex()` im
Client dient nur noch dem Tick-Sound (`hasEnteredNewSegment`).

---

## Wie der Gewinner bestimmt wird

```
Server:  rawSteps = crypto.randomInt(0, 359)
         resolveSpinWinner() bildet daraus den Landewinkel
           rotation = sign · (round(1800 × multiplier) + rawSteps)   (Startwinkel 0)
           → getSegmentIndex(rotation, n) = Segment unter dem Zeiger (270°)
           → rawSteps wird minimal verschoben, falls der Zeiger zu nah an
             einer Segmentgrenze läge (Animations-Nachlauf < 0.5°)
         winnerIndex wird am Spin-Token festgehalten, rawSteps geht als ranNum zurück
Client:  totalSteps = round(1800 × multiplier) + ranNum   (identische Formel)
         → animiert nur; der Endwinkel liegt sicher im Segment des Servers
```

Die Easing-Kurve bestimmt nur den Weg, nicht den Endwinkel — der Server muss sie
daher nicht kennen.

---

## Velocity-Kurve

```
15°/frame ──────────┐
                    │  ease-out (Exponent 1.4)
                    │       \
                    │         \
                    │           \_____
0.5°/frame          ▼                 → 100%
            |← 15%→| |←── 85% ──────→|
```

| Konstante | Wert | Bedeutung |
|---|---|---|
| `MAX_SPIN_VELOCITY` | 15°/frame | Vollgasphase |
| `MIN_SPIN_VELOCITY` | 0.5°/frame | Endgeschwindigkeit |
| `SPIN_FAST_PHASE_RATIO` | 0.15 | Anteil Phase 1 |
| `SPIN_EASE_EXPONENT` | 1.4 | Abbremskurve |
| `MIN_SPIN_ROTATIONS` | 1800° | Mindestdrehung (5 × 360°) |
| `DRUMROLL_LEAD_IN_STEPS` | 321 | Schritte vor Ende → Drumroll |

---

## SpinConfig — Snapshot-Prinzip

```typescript
interface SpinConfig {
  totalSteps: number;    // Gesamtdistanz der Animation
  spinToken: string;     // signierter Token für Coin-Vergabe
  names: string[];       // Snapshot beim Spin-Start — nicht live
  winnerName: string;    // vom Server bestimmt, nur zur Anzeige
}
```

`names` wird beim Spin-Start eingefroren. Ändert sich die Name-Liste während des Spins (z.B. via Room-Sync), bleibt die Animation konsistent.

`direction` wird bewusst **nicht** in `SpinConfig` gehalten — es wird nur einmalig in `animateSpin()` gebraucht, um das Vorzeichen der Animationsgeschwindigkeit festzulegen, und deshalb als eigener Parameter übergeben statt im langlebigen Config-Objekt mitgeschleppt. `stepAngle`/`segmentCount` entfallen ebenfalls — beide waren immer aus `names.length` ableitbar (`360 / names.length`) und werden jetzt bei Bedarf direkt in `winner-logic.ts` (`getSegmentIndex`) berechnet, statt redundant in der Config vorgehalten zu werden.

---

## spinToken-Sicherheit

Der Server stellt `spinToken` (UUID) bei `/api/random` aus und speichert ihn in der DB. `/api/award-coins` prüft ihn serverseitig und markiert ihn als verbraucht — jeder Token funktioniert genau einmal.