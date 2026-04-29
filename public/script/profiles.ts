import { supabaseClient } from './supabase-client.js';

function subscribeToCoinUpdates(userId: string): void {
  const coinDisplay = document.getElementById('coinDisplay') as HTMLSpanElement | null;
  if (!coinDisplay) return;

  supabaseClient
    .channel('coin-updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      (payload) => {
        const coins = (payload.new as any)?.coins ?? 0;
        coinDisplay.textContent = `🪙 ${coins}`;
        coinDisplay.style.display = 'inline';
      }
    )
    .subscribe();
}

export async function refreshCoinDisplay(): Promise<void> {
  const coinDisplay = document.getElementById('coinDisplay') as HTMLSpanElement | null;
  if (!coinDisplay) return;
 
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;
 
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('coins')
    .eq('id', session.user.id)
    .single();
 
  coinDisplay.textContent = `🪙 ${(profile as any)?.coins ?? 0}`;
  coinDisplay.style.display = 'inline';
}

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
    authButton.onclick = () => {
      window.location.href = '/login.html';
    };
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
  authButton.onclick = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  };

  subscribeToCoinUpdates(user.id);
}