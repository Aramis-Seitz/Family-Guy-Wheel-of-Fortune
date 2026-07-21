import { input } from "./names-in-wheel-list";
import { requiredElement, optionalElement } from "../shared/dom-helpers";
import { showToast } from "../shared/toast";
import { t } from "../app/i18n";
import {
  NAME_VALIDATION_ERROR,
  type NameValidationErrorCode,
  validateName,
} from "../shared/validation";

type NameValidationResult = ReturnType<typeof validateName>;

const INVALID_INPUT_CLASS = "name-input--invalid";

export const errorHint = requiredElement<HTMLParagraphElement>("name-error-hint");
export const centeredInput = optionalElement<HTMLDivElement>("name-centered-input");
export const inputCentered = optionalElement<HTMLInputElement>("name-input-centered");
export const addBtnCentered = optionalElement<HTMLButtonElement>("add-name-btn-centered");

function getNameValidationMessage(code: NameValidationErrorCode): string {
  switch (code) {
    case NAME_VALIDATION_ERROR.REQUIRED:
      return t("names.required");
    case NAME_VALIDATION_ERROR.INVALID_CHARACTERS:
      return t("names.invalidCharacters");
    default:
      return t("names.invalid");
  }
}

function setInputInvalidState(isInvalid: boolean): void {
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