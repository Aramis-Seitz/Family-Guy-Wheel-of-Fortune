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
import { mockRouter } from "./mock/routes";
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

function requireBasicAuth(req: Request, res: Response, next: NextFunction): void {
  const validUser = process.env.AUTH_USER;
  const validPwd = process.env.AUTH_PWD;

  if (!validUser || !validPwd) {
    next();
    return;
  }

  const header = req.headers.authorization ?? '';
  const b64 = header.replace(/^Basic\s+/i, '');

  if (b64) {
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    const colonIndex = decoded.indexOf(':');
    const inputUser = decoded.slice(0, colonIndex);
    const inputPwd = decoded.slice(colonIndex + 1);
    if (inputUser === validUser && inputPwd === validPwd) {
      return next();
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Wheeel"');
  res.status(401).send('Unauthorized');
}

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(['/login.html', '/main.html', '/signup.html'], requireBasicAuth);
app.use(express.static(path.resolve(__dirname, "../../public/dist/html")));
app.use(express.static(path.resolve(__dirname, "../../public/dist")));
app.use('/api', apiRoutes);

if (USE_MOCK) {
  app.use('/api/mock', mockRouter);
}


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

export default app;
