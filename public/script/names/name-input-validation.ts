import { input } from "../shared/dom.js";
import { showToast } from "../shared/toast.js";
import {
  NAME_VALIDATION_ERROR,
  type NameValidationErrorCode,
  validateName,
} from "../shared/validation.js";

type NameValidationResult = ReturnType<typeof validateName>;

const INVALID_INPUT_CLASS = "name-input-invalid";

function getNameValidationMessage(code: NameValidationErrorCode): string {
  switch (code) {
    case NAME_VALIDATION_ERROR.REQUIRED:
      return "Bitte einen Namen eingeben.";
    case NAME_VALIDATION_ERROR.INVALID_CHARACTERS:
      return "Nur Buchstaben, Zahlen und Apostrophe erlaubt.";
    default:
      return "Ungültige Eingabe.";
  }
}

function setInputInvalidState(isInvalid: boolean): void {
  input.classList.toggle("invalid", isInvalid);
  input.classList.toggle(INVALID_INPUT_CLASS, isInvalid);

  if (isInvalid) {
    input.setAttribute("aria-invalid", "true");
    return;
  }

  input.removeAttribute("aria-invalid");
}

export function showNameInputError(message: string): void {
  setInputInvalidState(true);
  showToast({
    message,
    type: "error"
  });
}

export function clearNameInputError(): void {
  setInputInvalidState(false);
}

export function validateNameInput(rawName: string): NameValidationResult {
  const result = validateName(rawName);

  if (result.valid) {
    clearNameInputError();
    return result;
  }

  showNameInputError(getNameValidationMessage(result.code));
  return result;
}

export function initNameInputValidation(): void {
  input.addEventListener("input", () => {
    const currentValue = input.value.trim();

    if (!currentValue) {
      clearNameInputError();
      return;
    }

    const result = validateName(currentValue);
    setInputInvalidState(!result.valid);
  });
}