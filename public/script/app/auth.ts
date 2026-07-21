import { supabaseClient } from "../shared/supabase-client";
import { showToast } from "../shared/toast";
import { apiUrl } from "../shared/api-base";
import { notifyAccountChanged } from "../shared/auth-channel";
import { initI18n, t } from "./i18n";
import { localizeHtmlElements } from "./html-localization";
import { initLanguageSwitcher } from "./language-switcher";

const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;

const loginEmailInput = document.getElementById('login-email') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement | null;

const signupUserInput = document.getElementById('signup-user') as HTMLInputElement | null;
const signupEmailInput = document.getElementById('signup-email') as HTMLInputElement | null;
const signupDateOfBirthInput = document.getElementById('signup-date-of-birth') as HTMLInputElement | null;
const signupPasswordInput = document.getElementById('signup-password') as HTMLInputElement | null;
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password') as HTMLInputElement | null;

async function initAuthPage(): Promise<void> {
    await initI18n();
    localizeHtmlElements();
    initLanguageSwitcher();
}

void initAuthPage();

if (loginForm) {
    loginForm.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();

        if (!loginEmailInput || !loginPasswordInput) {
            showToast({
                message: t('auth.loginFieldsNotFound'),
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
                    message: t('auth.loginFailed', { message: error.message }),
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
            console.error('Network error during login:', err);
            showToast({
                message: t('auth.networkError'),
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
                message: t('auth.registrationFieldsNotFound'),
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
                message: t('auth.enterUsername'),
                type: "error"
            });
            return;
        }

        if (!dateOfBirth) {
            showToast({
                message: t('auth.enterDateOfBirth'),
                type: "error"
            });
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        if (dateOfBirth > today) {
            showToast({
                message: t('auth.dobInFuture'),
                type: "error"
            });
            return;
        }

        if (password !== confirmPassword) {
            showToast({
                message: t('auth.passwordsMismatch'),
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
                    message: t('auth.registrationFailed', { message: error.message }),
                    type: "error"
                });
                return;
            }

            if (!data.user || !data.session) {
                showToast({
                    message: t('auth.userCreationFailed'),
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
                    message: t('auth.registrationFailed', { message: body.error ?? registerResponse.statusText }),
                    type: "error"
                });
                return;
            }

            window.location.href = "login.html"

        } catch (err: unknown) {
            console.error('Network error during registration:', err);
            showToast({
                message: t('auth.networkError'),
                type: "error"
            });
        }
    });
}//
