import { describe, expect, it } from 'vitest';
import { resolveWinner } from './winner-logic';
import type { SpinConfig } from './spin';

function makeConfig(overrides: Partial<SpinConfig> = {}): SpinConfig {
    return {
        totalSteps: 0,
        direction: 'right',
        stepAngle: 90,
        segmentCount: 4,
        spinToken: 'token',
        names: ['Peter', 'Lois', 'Stewie', 'Brian'],
        ...overrides,
    };
}

describe('resolveWinner', () => {

    it('returns the name at the pointer for rotation 0', () => {
        const config = makeConfig();

        const winner = resolveWinner(0, config);

        expect(winner).toBe('Brian');
    });

    it('returns different names for different rotations', () => {
        const config = makeConfig();

        const winner = resolveWinner(90, config);

        expect(winner).toBe('Stewie');
    });

    it('handles negative (left) rotation correctly (no negative index)', () => {
        const config = makeConfig();

        const winner = resolveWinner(-90, config);

        expect(winner).toBe('Peter');
    });

    it('is unaffected by full extra rotations (rotation > 360°)', () => {
        const config = makeConfig();
        const winnerAt90 = resolveWinner(90, config);

        const winnerAfterFullTurns = resolveWinner(90 + 3600, config);

        expect(winnerAfterFullTurns).toBe(winnerAt90);
    });

    it('selects the correct segment at an exact segment boundary', () => {
        const config = makeConfig();

        const winner = resolveWinner(180, config);

        expect(winner).toBe('Lois');
    });
});
