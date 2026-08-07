import { describe, expect, it } from 'vitest';
import { validateName } from './validation';

describe('validateName', () => {

    it('should return valid for a correct name', () => {
        const name = "ValidName123";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: true, value: name });
    });

    it('should return invalid for an empty name', () => {
        const name = "";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "required" });
    });

    it('should return invalid for a name with invalid characters', () => {
        const name = "Invalid@Name";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "invalid_characters" });
    });
});