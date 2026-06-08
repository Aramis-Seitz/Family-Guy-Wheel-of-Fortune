import type { VercelRequest, VercelResponse } from '@vercel/node';

type LoginResponse = {
  success: boolean;
  message?: string;
};

type LoginBody = {
  username?: string;
  password?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<LoginResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { username, password } = (req.body ?? {}) as LoginBody;

  const validUser = process.env.AUTH_USER;
  const validPwd = process.env.AUTH_PWD;
  const authSecret = process.env.AUTH_SECRET;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Benutzername und Passwort erforderlich.',
    });
  }

  if (username !== validUser || password !== validPwd) {
    return res.status(401).json({
      success: false,
      message: 'Ungültige Zugangsdaten.',
    });
  }

  res.setHeader(
    'Set-Cookie',
    `basic_auth=${authSecret}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`
  );

  return res.status(200).json({ success: true });
}