import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
const envDir = path.resolve(__dirname, '..');
if (existsSync(path.join(envDir, '.env.local'))) dotenv.config({ path: path.join(envDir, '.env.local'), override: true });
dotenv.config({ path: path.join(envDir, '.env') });

import express from "express";
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { mockRouter } from "./mock-routes";
import { apiRoutes } from "./routes";

const USE_MOCK = process.env.USE_MOCK === 'true';

if (process.env.HTTPS_PROXY && !USE_MOCK) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const app = express();
const PORT = 3000;
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
};

function requireBasicAuthCookie(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.AUTH_SECRET;
  if (!expected) {
    next();
    return;
  }

  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)basic_auth=([^;]+)/);
  const cookieValue = match?.[1];

  if (cookieValue !== expected) {
    res.redirect(302, '/');
    return;
  }

  next();
}

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(['/login.html', '/main.html', '/signup.html'], requireBasicAuthCookie);
app.use(express.static(path.resolve(__dirname, "../../public/dist/html")));
app.use(express.static(path.resolve(__dirname, "../../public/dist")));
app.use('/api', apiRoutes);

if (USE_MOCK) {
  app.use('/api/mock', mockRouter);
}

app.post('/api/basic-auth', (req, res) => {
  const { username, password } = req.body ?? {};
  const validUser = process.env.AUTH_USER;
  const validPwd = process.env.AUTH_PWD;
  const authSecret = process.env.AUTH_SECRET;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Benutzername und Passwort erforderlich.' });
    return;
  }

  if (!validUser || !validPwd || !authSecret) {
    res.status(500).json({ success: false, message: 'Auth-Konfiguration fehlt.' });
    return;
  }

  if (username !== validUser || password !== validPwd) {
    res.status(401).json({ success: false, message: 'Ungültige Zugangsdaten.' });
    return;
  }

  res.setHeader(
    'Set-Cookie',
    `basic_auth=${authSecret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
  );

  res.status(200).json({ success: true });
});

app.post('/api/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'basic_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.status(200).json({ success: true });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

export default app;
