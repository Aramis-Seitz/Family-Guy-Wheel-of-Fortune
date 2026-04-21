import { supabaseClient } from './supabase-client.js';

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
            window.location.href = '/main.html';
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
            const { data, error } = await supabaseClient.auth.signUp({
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

            if (!data.user) {
                showMessage('Benutzer konnte nicht erstellt werden.');
                return;
            }

            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username: username,
                        email: email,
                    },
                ]);

            if (profileError) {
                console.error('Profile Insert Error:', profileError);
                showMessage(`Benutzer erstellt, aber Profil konnte nicht gespeichert werden: ${profileError.message}`);
                return;
            }

            showMessage('Registrierung erfolgreich!');
        } catch (err: unknown) {
            console.error('Netzwerkfehler bei der Registrierung:', err);
            showMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.');
        }
    });
}