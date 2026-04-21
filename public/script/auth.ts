import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const signupForm = document.getElementById('signupForm') as HTMLFormElement | null;

const loginUsernameInput = document.getElementById('loginUser') as HTMLInputElement | null;
const loginEmailInput = document.getElementById('loginEmail') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('loginPassword') as HTMLInputElement | null;

const signupUserInput = document.getElementById('signupUser') as HTMLInputElement | null;
const signupEmailInput = document.getElementById('signupEmail') as HTMLInputElement | null;
const signupPasswordInput = document.getElementById('signupPassword') as HTMLInputElement | null;
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement | null;

function showMessage(message: string, type: string = 'info'): void {
    alert(message);
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!loginEmailInput || !loginPasswordInput) {
            showMessage('Login-Felder wurden nicht gefunden.', 'error');
            return;
        }
        const email: string = loginEmailInput.value;
        const password: string = loginPasswordInput.value;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login Error:', error);
                showMessage(`Login fehlgeschlagen: ${error.message}`, 'error');
            } else {
                console.log('Login erfolgreich:', data);
                showMessage('Login erfolgreich!', 'success');
                window.location.href = 'main.html';
            }
        } catch (err: unknown) {
            console.error('Netzwerkfehler beim Login:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.', 'error');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!signupUserInput || !signupEmailInput || !signupPasswordInput || !signupConfirmPasswordInput) {
            showMessage('Registrierungs-Felder wurden nicht gefunden.', 'error');
            return;
        }

        const username: string = signupUserInput.value;
        const email: string = signupEmailInput.value;
        const password: string = signupPasswordInput.value;
        const confirmPassword: string = signupConfirmPasswordInput.value;

        if (password !== confirmPassword) {
            showMessage('Passwörter stimmen nicht überein!', 'error');
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                    },
                },
            });

            if (error) {
                console.error('Signup Error:', error);
                showMessage(`Registrierung fehlgeschlagen: ${error.message}`, 'error');
            } else {
                console.log('Registrierung erfolgreich:', data);
                showMessage(
                    'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.',
                    'success'
                );
            }
        } catch (err: unknown) {
            console.error('Netzwerkfehler bei der Registrierung:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.', 'error');
        }
    });
}

async function checkAuthStatus(): Promise<void> {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser();

    if (user) {
        console.log('Benutzer ist angemeldet:', user);
        console.log('Username:', user.user_metadata?.username);
    } else {
        console.log('Kein Benutzer angemeldet.');
    }
}