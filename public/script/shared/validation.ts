export type NameValidationResult =
  | { valid: true; value: string }
  | { valid: false; code: NameValidationErrorCode };

export const NAME_VALIDATION_ERROR = {
  REQUIRED: "required",
  INVALID_CHARACTERS: "invalid_characters",
  TOO_LONG: "too_long",
} as const;

export type NameValidationErrorCode =
  (typeof NAME_VALIDATION_ERROR)[keyof typeof NAME_VALIDATION_ERROR];

// Muss mit WHEEL_NAME_PATTERN in server/src/services/room-service.ts übereinstimmen.
// '#' ist erlaubt, weil Spielernamen als "username#suffix" in der Namensliste landen.
const NAME_PATTERN = /^[A-Za-z0-9'#]+$/;

// Muss mit dem maxlength-Attribut der Name-Inputs in main.html übereinstimmen.
export const MAX_NAME_LENGTH = 20;

export function validateName(rawName: string): NameValidationResult {
  const value = rawName.trim();

  if (!value) {
    return { valid: false, code: NAME_VALIDATION_ERROR.REQUIRED };
  }

  if (!NAME_PATTERN.test(value)) {
    return { valid: false, code: NAME_VALIDATION_ERROR.INVALID_CHARACTERS };
  }

  if (value.length > MAX_NAME_LENGTH) {
    return { valid: false, code: NAME_VALIDATION_ERROR.TOO_LONG };
  }

  return { valid: true, value };
}
