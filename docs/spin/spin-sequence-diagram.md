# Spin Sequenzdiagramm

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant Server

    User->>Client: Spin-Button klicken
    Client->>Server: POST /api/spins
    Note over Server: Gewinner bestimmen, am Spin-Token festhalten
    Server-->>Client: ranNum (0–359°), spinToken, winnerName

    Note over Client: totalSteps = round(1800 × mult) + ranNum<br/>Animation läuft (rAF-Loop)

    Client->>Server: POST /api/spins/:spinToken/award (nur Token)
    Server-->>Client: Coins vergeben (Gewinner aus dem Token)

    Client->>User: Gewinner-Modal anzeigen
    User->>Client: Modal schließen
```
