import { supabaseClient } from './supabase-client.js';

export async function initProfileUI(): Promise<void> {
  const profileNameElement = document.getElementById('profileName') as HTMLSpanElement | null;
  const authButton = document.getElementById('authButton') as HTMLButtonElement | null;

  if (!profileNameElement || !authButton) return;

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    profileNameElement.textContent = 'Nicht eingeloggt';
    authButton.textContent = 'Login';
    authButton.onclick = () => {
      window.location.href = '/';
    };
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profil konnte nicht geladen werden:', profileError);
    profileNameElement.textContent = 'Eingeloggt';
  } else {
    profileNameElement.textContent = profile.username;
  }

  authButton.textContent = 'Logout';
  authButton.onclick = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };
}