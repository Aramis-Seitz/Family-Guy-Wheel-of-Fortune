import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const signupForm = document.getElementById('signupForm') as HTMLFormElement | null;

const loginEmailInput = document.getElementById('loginEmail') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('loginPassword') as HTMLInputElement | null;

const signupUserInput = document.getElementById('signupUser') as HTMLInputElement | null;
const signupEmailInput = document.getElementById('signupEmail') as HTMLInputElement | null;
const signupPasswordInput = document.getElementById('signupPassword') as HTMLInputElement | null;
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement | null;

function showMessage(message: string): void {
    alert(message);
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!loginEmailInput || !loginPasswordInput) {
            showMessage('Login-Felder wurden nicht gefunden.');
            return;
        }

        const email: string = loginEmailInput.value.trim();
        const password: string = loginPasswordInput.value;

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login Error:', error);
                showMessage(`Login fehlgeschlagen: ${error.message}`);
                return;
            }

            showMessage('Login erfolgreich!');
            window.location.href = 'main.html';
        } catch (err: unknown) {
            console.error('Netzwerkfehler beim Login:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!signupUserInput || !signupEmailInput || !signupPasswordInput || !signupConfirmPasswordInput) {
            showMessage('Registrierungs-Felder wurden nicht gefunden.');
            return;
        }

        const username: string = signupUserInput.value.trim();
        const email: string = signupEmailInput.value.trim();
        const password: string = signupPasswordInput.value;
        const confirmPassword: string = signupConfirmPasswordInput.value;

        if (!username) {
            showMessage('Bitte Username eingeben.');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwörter stimmen nicht überein!');
            return;
        }

        try {
            const { error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    },
                },
            });

            if (error) {
                console.error('Signup Error:', error);
                showMessage(`Registrierung fehlgeschlagen: ${error.message}`);
                return;
            }

            showMessage('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.');
        } catch (err: unknown) {
            console.error('Netzwerkfehler bei der Registrierung:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.');
        }
    });
}