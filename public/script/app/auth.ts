import { supabaseClient } from "../shared/supabase-client";
import { showToast } from "../shared/toast";
import { apiUrl } from "../shared/api-base";
import { notifyAccountChanged } from "../shared/auth-channel";

const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;

const loginEmailInput = document.getElementById('login-email') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement | null;

const signupUserInput = document.getElementById('signup-user') as HTMLInputElement | null;
const signupEmailInput = document.getElementById('signup-email') as HTMLInputElement | null;
const signupDateOfBirthInput = document.getElementById('signup-date-of-birth') as HTMLInputElement | null;
const signupPasswordInput = document.getElementById('signup-password') as HTMLInputElement | null;
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password') as HTMLInputElement | null;

if (loginForm) {
    loginForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!loginEmailInput || !loginPasswordInput) {
            showToast({
                message: "Login-Felder wurden nicht gefunden.",
                type: "error"
            });
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
                showToast({
                    message: `Login fehlgeschlagen: ${error.message}`,
                    type: "error"
                });
                return;
            }

            if (!error) {
                notifyAccountChanged();
                window.location.href = "main.html";
            }

            window.location.href = 'main.html';
        } catch (err: unknown) {
            console.error('Netzwerkfehler beim Login:', err);
            showToast({
                message: "Netzwerkfehler. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!signupUserInput || !signupEmailInput || !signupDateOfBirthInput || !signupPasswordInput || !signupConfirmPasswordInput) {
            showToast({
                message: "Registrierungs-Felder wurden nicht gefunden.",
                type: "error"
            });
            return;
        }

        const username: string = signupUserInput.value.trim();
        const email: string = signupEmailInput.value.trim();
        const dateOfBirth: string = signupDateOfBirthInput.value;
        const password: string = signupPasswordInput.value;
        const confirmPassword: string = signupConfirmPasswordInput.value;

        if (!username) {
            showToast({
                message: "Bitte Username eingeben",
                type: "error"
            });
            return;
        }

        if (!dateOfBirth) {
            showToast({
                message: "Bitte Geburtsdatum eingeben.",
                type: "error"
            });
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        if (dateOfBirth > today) {
            showToast({
                message: "Geburtsdatum darf nicht in der Zukunft liegen.",
                type: "error"
            });
            return;
        }

        if (password !== confirmPassword) {
            showToast({
                message: "Passwörter stimmen nicht überein!",
                type: "error"
            });
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        date_of_birth: dateOfBirth,
                    },
                },
            });

            if (error) {
                console.error('Signup Error:', error);
                showToast({
                    message: `Registrierung fehlgeschlagen: ${error.message}`,
                    type: "error"
                });
                return;
            }

            if (!data.user || !data.session) {
                showToast({
                    message: "Benutzer konnte nicht erstellt werden.",
                    type: "error"
                });
                return;
            }

            const registerResponse = await fetch(apiUrl("/api/user/register"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({ username, email, dateOfBirth }),
            });

            if (!registerResponse.ok) {
                const body = await registerResponse.json().catch(() => ({})) as { error?: string };
                showToast({
                    message: `Registrierung fehlgeschlagen: ${body.error ?? registerResponse.statusText}`,
                    type: "error"
                });
                return;
            }

            window.location.href = "login.html"

        } catch (err: unknown) {
            console.error('Netzwerkfehler bei der Registrierung:', err);
            showToast({
                message: "Netzwerkfehler. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
        }
    });
}//
