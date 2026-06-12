import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const validUser = process.env.AUTH_USER;
  const validPwd = process.env.AUTH_PWD;
  const authSecret = process.env.AUTH_SECRET;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Benutzername und Passwort erforderlich.' });
    return;
  }

  if (username !== validUser || password !== validPwd) {
    res.status(401).json({ success: false, message: 'Ungültige Zugangsdaten.' });
    return;
  }

  res.setHeader(
    'Set-Cookie',
    `basic_auth=${authSecret}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`
  );

  res.status(200).json({ success: true });
}
