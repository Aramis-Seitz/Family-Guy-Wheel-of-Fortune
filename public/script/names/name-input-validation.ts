import { input } from "../shared/dom.js";
import { validateName } from "../shared/validation.js";

type NameValidationResult = ReturnType<typeof validateName>;

const ERROR_ELEMENT_ID = "nameInputFieldError";
const ERROR_ELEMENT_CLASS = "name-input-field-error";
const HOST_ELEMENT_CLASS = "name-input-validation-host";
const INVALID_INPUT_CLASS = "name-input-invalid";

function getInputRow(): HTMLDivElement {
  const row = input.closest<HTMLDivElement>(".add-row");

  if (!row) {
    throw new Error("Missing .add-row container for #nameInput.");
  }

  return row;
}

function getExistingErrorElement(): HTMLParagraphElement | null {
  return document.getElementById(ERROR_ELEMENT_ID) as HTMLParagraphElement | null;
}

function createErrorElement(): HTMLParagraphElement {
  const inputRow = getInputRow();
  const errorElement = document.createElement("p");

  inputRow.classList.add(HOST_ELEMENT_CLASS);

  errorElement.id = ERROR_ELEMENT_ID;
  errorElement.className = ERROR_ELEMENT_CLASS;
  errorElement.setAttribute("role", "alert");
  errorElement.setAttribute("aria-live", "polite");
  errorElement.hidden = true;

  inputRow.appendChild(errorElement);
  input.setAttribute("aria-describedby", ERROR_ELEMENT_ID);

  return errorElement;
}

function getErrorElement(): HTMLParagraphElement {
  const existingElement = getExistingErrorElement();

  if (existingElement) {
    return existingElement;
  }

  return createErrorElement();
}

function updateErrorMessage(message: string): void {
  const errorElement = getErrorElement();

  errorElement.textContent = message;
  errorElement.hidden = message.length === 0;
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
  updateErrorMessage(message);
  setInputInvalidState(true);
}

export function clearNameInputError(): void {
  updateErrorMessage("");
  setInputInvalidState(false);
}

export function validateNameInput(rawName: string): NameValidationResult {
  const result = validateName(rawName);

  if (result.valid) {
    clearNameInputError();
    return result;
  }

  showNameInputError(result.message);
  return result;
}

export function initNameInputValidation(): void {
  getErrorElement();

  input.addEventListener("input", () => {
    const currentValue = input.value.trim();

    if (!currentValue) {
      clearNameInputError();
      return;
    }

    validateNameInput(currentValue);
  });
}