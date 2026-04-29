import { supabaseClient } from "../shared/supabase-client.js";

export async function initProfileUI(): Promise<void> {
  const profileNameElement = document.getElementById('profileName') as HTMLSpanElement | null;
  const authButton = document.getElementById('authButton') as HTMLButtonElement | null;

  if (!profileNameElement || !authButton) return;

  const {
    data: { session },
    error: sessionError,
  } = await supabaseClient.auth.getSession();

  if (sessionError || !session || !session.user) {
    profileNameElement.textContent = 'Nicht eingeloggt';
    authButton.textContent = 'Login';
    authButton.addEventListener('click', () => {
      window.location.href = '/login.html';
    });
    return;
  }

  const user = session.user;

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('username, coins')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profil konnte nicht geladen werden:', profileError);
    profileNameElement.textContent = 'Eingeloggt';
  } else {
    profileNameElement.textContent = profile.username;

    const coinDisplay = document.getElementById('coinDisplay') as HTMLSpanElement | null;
    if (coinDisplay) {
      coinDisplay.textContent = `🪙 ${profile.coins ?? 0}`;
      coinDisplay.style.display = 'inline';
    }
  }

  authButton.textContent = 'Logout';
  authButton.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}
