import { showToast } from "../shared/toast";

const addItemBody = document.getElementById('loginForm') as HTMLFormElement | null;
const loginUserInput = document.getElementById('loginUser') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('loginPassword') as HTMLInputElement | null;

if (addItemBody) {
  addItemBody.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();

    if (!loginUserInput || !loginPasswordInput) {
      showToast({
        message: "Login-Felder wurden nicht gefunden.",
        type: "error"
      });
      return;
    }

    const username = loginUserInput.value.trim();
    const password = loginPasswordInput.value;

    try {
      const response = await fetch('./api/basic-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast({
        message: result.message ?? "Login fehlgeschlagen.",
        type: "error"
      });
        return;
      }
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Login request failed:', error);
      showToast({
        message: "Netzwerkfehler. Bitte später erneut versuchen.",
        type: "error"
      });
    }
  });
}