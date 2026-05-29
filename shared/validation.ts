export type NameValidationResult =
  | { valid: true; value: string }
  | { valid: false; code: NameValidationErrorCode };

export const NAME_VALIDATION_ERROR = {
  REQUIRED: "required",
  INVALID_CHARACTERS: "invalid_characters",
} as const;

export type NameValidationErrorCode =
  (typeof NAME_VALIDATION_ERROR)[keyof typeof NAME_VALIDATION_ERROR];

const NAME_PATTERN = /^[A-Za-z0-9']+$/;

export function validateName(rawName: string): NameValidationResult {
  const value = rawName.trim();

  if (!value) {
    return { valid: false, code: NAME_VALIDATION_ERROR.REQUIRED };
  }

  if (!NAME_PATTERN.test(value)) {
    return { valid: false, code: NAME_VALIDATION_ERROR.INVALID_CHARACTERS };
  }

  return { valid: true, value };
}
