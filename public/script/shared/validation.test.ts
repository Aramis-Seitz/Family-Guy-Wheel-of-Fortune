import { describe, expect, it } from 'vitest';
import { validateName } from './validation';

describe('validateName', () => {

    it('should return valid for a name that includes either lower case letters, upper case letters, numbers and apostrophes', () => {
        const name = "ValidName'123";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: true, value: name });
    });

    it('should return valid for a name that is only 1 character long', () => {
        const name = "A";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: true, value: name });
    });

    it('should return valid for a name ending or starting with empty spaces', () => {
        const name = "  ValidName  ";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: true, value: "ValidName" });
    });

    it('should return invalid for a name that includes empty spaces in between valid characters', () => {
        const name = "Invalid Name";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "invalid_characters" });
    });

    it('should return invalid for a name that is longer than 20 characters', () => {
        const name = "ThisNameIsWayTooLongToBeValid";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "too_long" });
    });

    it('should return invalid for an empty name', () => {
        const name = "";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "required" });
    });

    it('should return invalid for a name consting only of empty spaces', () => {
        const name = "     ";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "required" });
    });

    it('should return valid for a player display name with a suffix', () => {
        const name = "ValidName#01";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: true, value: name });
    });

    it('should return invalid for a name that includes special characters', () => {
        const name = "Invalid$Name";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "invalid_characters" });
    });

    it('should return invalid for a name that includes umlauts', () => {
        const name = "InvalidNameÄÖÜ";

        const result = validateName(name);

        expect(result).toStrictEqual({ valid: false, code: "invalid_characters" });
    });
});