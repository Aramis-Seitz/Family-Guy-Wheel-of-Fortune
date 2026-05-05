const addItemBody = document.getElementById('loginForm') as HTMLFormElement | null;
const loginUserInput = document.getElementById('loginUser') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('loginPassword') as HTMLInputElement | null;

function showMessage(message: string): void {
  alert(message);
}

if (addItemBody) {
  addItemBody.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();

    if (!loginUserInput || !loginPasswordInput) {
      showMessage('Login-Felder wurden nicht gefunden.');
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
        showMessage(result.message ?? 'Login fehlgeschlagen.');
        return;
      }
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Login request failed:', error);
      showMessage('Netzwerkfehler. Bitte später erneut versuchen.');
    }
  });
}