# How to: Vitest Unit Tests

## Ziel

Kurze, isolierte Tests fuer Funktionen schreiben (ohne echte DB/Netzwerkzugriffe).

## Grundaufbau

```ts
import { describe, it, expect } from "vitest";

describe("FunktionX", () => {
    it("liefert/macht Y unter Bedingung Z", () => {
        // Arrange
        // Act
        // Assert
    });
});
```

## it-Block: Reihenfolge

1. Expected Output festlegen
Der erwartete Effekt steht im it-Titel (z. B. "wirft 404, wenn room nicht existiert").

2. Arrange (Given)
Inputs, Testdaten und Mocks vorbereiten.

3. Act (When)
Funktion genau einmal aufrufen.

4. Assert (Then)
Mit expect(...) Ergebnis, Fehler oder Nebenwirkungen pruefen.

## Mini-Beispiele

Erfolgsfall:

```ts
it("schliesst den room, wenn host verlaesst", async () => {
    // Arrange
    vi.mocked(getRoomByKey).mockResolvedValueOnce({ host_id: "u1" } as any);

    // Act
    const result = leaveRoom("u1", "ABC123");

    // Assert
    await expect(result).resolves.toBeUndefined();
    expect(clearRoomPlayers).toHaveBeenCalledWith("ABC123");
    expect(deleteRoomByKey).toHaveBeenCalledWith("ABC123");
});
```

Fehlerfall:

```ts
it("wirft 404, wenn room nicht existiert", async () => {
    // Arrange
    vi.mocked(getRoomByKey).mockResolvedValueOnce(null);

    // Act + Assert
    await expect(leaveRoom("u1", "ABC123")).rejects.toMatchObject({ statusCode: 404 });
});
```

## Praktische Regeln

- Ein it testet genau einen Fall.
- Keine echten externen Abhaengigkeiten im Unit-Test (mocken statt echte DB).
- Testnamen immer als Verhalten formulieren: "sollte ... wenn ...".
- Erst Branches abdecken, dann Sonderfaelle erweitern.
