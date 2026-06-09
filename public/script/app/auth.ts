import { supabaseClient } from "../shared/supabase-client.js";
import { showToast } from "../shared/toast.js";

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const signupForm = document.getElementById('signupForm') as HTMLFormElement | null;

const loginEmailInput = document.getElementById('loginEmail') as HTMLInputElement | null;
const loginPasswordInput = document.getElementById('loginPassword') as HTMLInputElement | null;

const signupUserInput = document.getElementById('signupUser') as HTMLInputElement | null;
const signupEmailInput = document.getElementById('signupEmail') as HTMLInputElement | null;
const signupDateOfBirthInput = document.getElementById('signupDateOfBirth') as HTMLInputElement | null;
const signupPasswordInput = document.getElementById('signupPassword') as HTMLInputElement | null;
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement | null;

async function createUserDefaultSelection(userId: string, assets: { id: string; category: string; name: string }[]): Promise<void> {
    const entries = assets.map(asset => ({
        user_id: userId,
        category: asset.category,
        asset_id: asset.id,
    }));

    const { error } = await supabaseClient.from('asset_selection').insert(entries);

    if (error) {
        throw new Error(`Asset-Selection Fehler: ${error.message}`);
    }
}

async function createUserDefaultOwnership(userId: string, assets: { id: string; name: string }[]): Promise<void> {
    const entries = assets.map(asset => ({
        user_id: userId,
        asset_id: asset.id,
    }));

    const { error } = await supabaseClient.from('asset_ownership').insert(entries);

    if (error) {
        throw new Error(`Asset-Ownership Fehler: ${error.message}`);
    }
}

async function createUserDefaultAssets(userId: string): Promise<void> {
    const { data: assets, error: assetsError } = await supabaseClient
        .from('asset')
        .select('id, category, name')
        .in('name', ['Quagmire', 'Peter Laugh']);

    if (assetsError || !assets || assets.length === 0) {
        throw new Error('Keine Standard-Assets gefunden');
    }

    await createUserDefaultSelection(userId, assets);
    await createUserDefaultOwnership(userId, assets);
}

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

            if (!data.user) {
                showToast({
                    message: "Benutzer konnte nicht erstellt werden.",
                    type: "error"
                });
                return;
            }

            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username: username,
                        email: email,
                        date_of_birth: dateOfBirth,
                    },
                ]);

            if (profileError) {
                console.error('Profile Insert Error:', profileError);
                showToast({
                    message: `Benutzer erstellt, aber Profil konnte nicht gespeichert werden: ${profileError.message}`,
                    type: "error"
                });
                return;
            }

            await createUserDefaultAssets(data.user.id);

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
