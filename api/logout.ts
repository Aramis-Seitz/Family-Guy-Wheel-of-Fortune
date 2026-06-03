import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader(
    'Set-Cookie',
    'basic_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );

  res.status(200).json({ success: true });
}
