import { Router } from 'express';
import { randomUUID } from 'crypto';
import {
  store,
  findProfile,
  findProfileByEmail,
  findProfileByUsername,
  createProfile,
  getSavedLinks,
  createSavedLink,
  deleteSavedLink,
} from './mock-store';

export function decodeMockJwt(jwt: string): { id: string; email: string; username: string } | null {
  if (!jwt.startsWith('mock_')) return null;
  try {
    return JSON.parse(Buffer.from(jwt.slice(5), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export const mockRouter = Router();

mockRouter.post('/auth/signup', (req, res) => {
  const { email, password, username } = req.body ?? {};

  if (!email || !password || !username) {
    res.status(400).json({ error: 'email, password und username erforderlich' });
    return;
  }

  if (findProfileByEmail(email)) {
    res.status(400).json({ error: 'Diese E-Mail ist bereits registriert' });
    return;
  }

  const id = randomUUID();
  createProfile({ id, email, username, password });

  const payload = Buffer.from(JSON.stringify({ id, email, username })).toString('base64');
  res.json({ token: `mock_${payload}`, user: { id, email, user_metadata: { username } } });
});

mockRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  const profile = findProfileByEmail(email ?? '');
  if (!profile || profile.password !== password) {
    res.status(401).json({ error: 'Ungültige E-Mail oder Passwort' });
    return;
  }

  const { id, username } = profile;
  const payload = Buffer.from(JSON.stringify({ id, email: profile.email, username })).toString('base64');
  res.json({ token: `mock_${payload}`, user: { id, email: profile.email, user_metadata: { username } } });
});

mockRouter.get('/profile/by-username/:username', (req, res) => {
  const profile = findProfileByUsername(req.params.username);
  if (!profile) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ id: profile.id, username: profile.username, email: profile.email, coins: profile.coins });
});

mockRouter.get('/profile/:userId', (req, res) => {
  const profile = findProfile(req.params.userId);
  if (!profile) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ id: profile.id, username: profile.username, email: profile.email, coins: profile.coins });
});

mockRouter.post('/profile', (req, res) => {
  const { id, username, email } = req.body ?? {};
  if (findProfile(id)) {
    // already created during signup – silent no-op
    res.status(409).json({ error: 'Already exists' });
    return;
  }
  const profile = createProfile({ id, username, email, password: '' });
  res.json(profile);
});

mockRouter.get('/saved_links/:userId', (req, res) => {
  res.json(getSavedLinks(req.params.userId));
});

mockRouter.post('/saved_links', (req, res) => {
  const { user_id, link_name, url } = req.body ?? {};
  const link = createSavedLink({ user_id, link_name, url });
  res.json(link);
});

mockRouter.delete('/saved_links/:id', (req, res) => {
  deleteSavedLink(req.params.id);
  res.json({ success: true });
});
