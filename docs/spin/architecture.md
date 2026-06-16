# Wheel-Spinning Architektur

## Module

| Modul | Verantwortung |
|---|---|
| `wheel/spin.ts` | rAF-Animationsloop, Button-Lock, Reset |
| `wheel/multiplier.ts` | Multiplier-Slider: lesen, setzen, anzeigen |
| `wheel/renderer.ts` | SVG-Generierung (einmalig beim Namen-Update) |
| `wheel/winner.ts` | Gewinner-Berechnung, Modal, Confetti, Coin-Vergabe |
| `wheel/sound.ts` | Web Audio API: Tick, Drumroll, Cymbal, Asset-Sound |
| `api/client-api.ts` | `/api/random` (Landungswinkel holen), `/api/award-coins` |

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
│  2. names = getNames()  ← Snapshot für diesen Spin             │
│  3. fetchRandomNumber(names, currentRotation, dir, multiplier)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  POST /api/random
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Server: generateSpin()                             │
│  rawSteps  = crypto.randomInt(0, 359)   ← Landungswinkel       │
│  spinToken = randomUUID()  → in DB gespeichert                  │
│  ← { ranNum: rawSteps, spinToken }                              │
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
│  PHASE 1 (0–15%):   velocity = 15°/frame  (Vollgas)            │
│  PHASE 2 (15–100%): ease-out, Exponent 1.4 → 0.5°/frame        │
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
│              winner.ts: resolveWinner() + announceWinner()      │
│  pointerAngle = (270° − rotation) mod 360                       │
│  winnerIndex  = floor(pointerAngle / stepAngle)                 │
│  winnerName   = config.names[winnerIndex]  ← aus Snapshot       │
│                                                                 │
│  → Modal anzeigen, Confetti, POST /api/award-coins              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Wie der Gewinner bestimmt wird

```
Server:  rawSteps = crypto.randomInt(0, 359)
Client:  totalSteps = round(1800 × multiplier) + rawSteps
         → rawSteps bestimmt den Landungswinkel
         → 1800° stellt sicher, dass mehrere volle Umdrehungen stattfinden
         → resolveWinner() liest ab, welches Segment am Zeiger liegt
```

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
  direction: Direction;  // "left" | "right"
  stepAngle: number;     // 360 / names.length
  segmentCount: number;
  spinToken: string;     // signierter Token für Coin-Vergabe
  names: string[];       // Snapshot beim Spin-Start — nicht live
}
```

`names` wird beim Spin-Start eingefroren. Ändert sich die Name-Liste während des Spins (z.B. via Room-Sync), bleibt die Gewinner-Berechnung konsistent.

---

## spinToken-Sicherheit

Der Server stellt `spinToken` (UUID) bei `/api/random` aus und speichert ihn in der DB. `/api/award-coins` prüft ihn serverseitig und markiert ihn als verbraucht — jeder Token funktioniert genau einmal.
