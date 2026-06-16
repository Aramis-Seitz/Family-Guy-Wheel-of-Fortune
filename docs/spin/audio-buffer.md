# Audio-Buffer-Architektur

## Web Audio Node-Graph

Alle Sounds laufen durch denselben `masterGain` — der Lautstärke-Slider steuert damit alles zentral.

```mermaid
graph LR
    T[BufferSource\nTick]
    D[BufferSource\nDrumroll\nloop = true]
    C[BufferSource\nCymbal]
    A[BufferSource\nAsset]

    DG[drumrollGain\nFade-Out 200 ms]
    AG[assetGain\nFade-In/Out 40 ms]
    MG[masterGain\nLautstärke-Slider]
    OUT[🔊 destination]

    T -->|direkt| MG
    D --> DG --> MG
    C -->|direkt| MG
    A --> AG --> MG
    MG --> OUT
```

## Buffer-Loading & Cache

`loadBuffer` wird von allen Sound-Typen genutzt. Jede URL wird nur einmal über das Netz geladen.

```mermaid
flowchart TD
    A([loadBuffer url]) --> B{bufferCache\nhat url?}
    B -- ja --> C[AudioBuffer zurückgeben]
    B -- nein --> D[fetch url]
    D --> E[decodeAudioData]
    E --> F[bufferCache.set]
    F --> C
    C --> G[createBufferSource]
    G --> H[source.connect gain / masterGain]
    H --> I([source.start])
```

## Preloading

| Sound | Geladen wann | Gespeichert in |
|---|---|---|
| Tick | `preloadTickBuffer()` beim Start | `tickBuffer` |
| Drumroll | `preloadStaticSounds()` beim Start | `drumrollBuffer` |
| Cymbal | `preloadStaticSounds()` beim Start | `cymbalBuffer` |
| Asset | bei erstem `playAssetSound()` | `bufferCache` Map |
