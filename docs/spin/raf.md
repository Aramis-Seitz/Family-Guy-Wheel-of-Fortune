# Was ist rAF?

**rAF** steht für `requestAnimationFrame` — eine Browser-API, die eine Callback-Funktion aufruft, kurz bevor der Browser den nächsten Frame auf den Bildschirm zeichnet.

```typescript
requestAnimationFrame(() => runSpinFrame(state, config));
```

## Vorteile gegenüber `setTimeout` / `setInterval`

| | `setInterval` | `requestAnimationFrame` |
|---|---|---|
| Takt | fester Timer, unabhängig vom Display | synchron mit der Bildwiederholrate (~60 fps = 16 ms) |
| Hintergrund-Tab | läuft weiter | pausiert automatisch |
| Optimierung | keine | vom Browser für Animationen optimiert |

## Im Spin-Code

Jeder rAF-Callback ist ein Frame des Animationsloops. Das Rad wird pro Frame um `velocity` Grad weitergedreht — so lange, bis `distanceTravelled >= totalSteps`:

```typescript
function runSpinFrame(state, config) {
  // Rotation berechnen, CSS setzen, Sound prüfen ...
  if (state.distanceTravelled >= config.totalSteps) {
    finishSpin(config);
  } else {
    requestAnimationFrame(() => runSpinFrame(state, config));
  }
}
```
