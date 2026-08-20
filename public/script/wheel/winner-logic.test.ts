import { describe, expect, it } from 'vitest';
import { resolveWinner } from './winner-logic';

describe('resolveWinner', () => {

    it('returns names[3] for rotation 0° on a 4-name wheel', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian'];

        const winner = resolveWinner(0, names);

        expect(winner).toBe('Brian');
    });

    it('returns names[2] for rotation 90° on a 4-name wheel', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian'];

        const winner = resolveWinner(90, names);

        expect(winner).toBe('Stewie');
    });

    it('returns names[0] for rotation -90° (left spin) on a 4-name wheel', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian'];

        const winner = resolveWinner(-90, names);

        expect(winner).toBe('Peter');
    });

    it('returns the same winner for rotation 90° and rotation 90°+10 full turns (3690°)', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian'];

        const winnerAt90 = resolveWinner(90, names);
        const winnerAfterFullTurns = resolveWinner(90 + 3600, names);

        expect(winnerAfterFullTurns).toBe(winnerAt90);
    });

    it('returns names[1] for rotation 180°, exactly on the segment boundary', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian'];

        const winner = resolveWinner(180, names);

        expect(winner).toBe('Lois');
    });

    it('returns names[1] for rotation 0° on a 2-name wheel', () => {
        const names = ['Peter', 'Lois'];

        const winner = resolveWinner(0, names);

        expect(winner).toBe('Lois');
    });

    it('returns names[2] for rotation 100° on a 5-name wheel', () => {
        const names = ['Peter', 'Lois', 'Stewie', 'Brian', 'Meg'];

        const winner = resolveWinner(100, names);

        expect(winner).toBe('Stewie');
    });
});
