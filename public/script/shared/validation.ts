export type NameValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

const NAME_PATTERN = /^[A-Za-z0-9]+$/;

export function validateName(rawName: string): NameValidationResult {
  const value = rawName.trim();

  if (!value) {
    return { valid: false, message: "Bitte einen Namen eingeben." };
  }

  if (!NAME_PATTERN.test(value)) {
    return { valid: false, message: "Nur Buchstaben und Zahlen erlaubt." };
  }

  return { valid: true, value };
}
