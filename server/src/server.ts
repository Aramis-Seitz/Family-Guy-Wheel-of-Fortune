import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
const envDir = path.resolve(__dirname, '..');
if (existsSync(path.join(envDir, '.env.local'))) dotenv.config({ path: path.join(envDir, '.env.local'), override: true });
dotenv.config({ path: path.join(envDir, '.env') });

import express from "express";
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import cors from "cors";
import { mockRouter } from "./mock/routes";
import { apiRoutes } from "./routes";
import { requireBasicAuthExpress } from "./lib/basic-auth";

const USE_MOCK = process.env.USE_MOCK === 'true';

if (process.env.HTTPS_PROXY && !USE_MOCK) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const app = express();
const PORT = 3000;
const publicRootDir = path.resolve(__dirname, "../../public");
const distHtmlDir = path.resolve(publicRootDir, "dist/html");
const sourceHtmlDir = path.resolve(publicRootDir, "html");
const errorPages: Record<number, string> = {
  403: "403.html",
  404: "404.html",
  500: "500.html",
  503: "503.html",
};

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
};

export function resolveErrorPagePath(statusCode: number): string {
  const fallbackStatus = Object.prototype.hasOwnProperty.call(errorPages, statusCode) ? statusCode : 500;
  const pageName = errorPages[fallbackStatus];

  const candidates = [
    path.join(distHtmlDir, pageName),
    path.join(sourceHtmlDir, pageName),
  ];

  const existing = candidates.find((candidate) => {
    try {
      return require('fs').existsSync(candidate);
    } catch {
      return false;
    }
  });

  return existing ?? path.join(sourceHtmlDir, pageName);
}

export function sendErrorPage(res: express.Response, statusCode: number): void {
  const safeStatus = Object.prototype.hasOwnProperty.call(errorPages, statusCode) ? statusCode : 500;
  res.status(safeStatus).sendFile(resolveErrorPagePath(safeStatus));
}

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(['/login.html', '/main.html', '/signup.html'], requireBasicAuthExpress);
app.use('/css', express.static(path.resolve(__dirname, '../../public/css')));
app.use('/resources', express.static(path.resolve(__dirname, '../../public/resources')));
app.use('/locales', express.static(path.resolve(__dirname, '../../public/locales')));

app.get(['/403.html', '/404.html', '/500.html', '/503.html'], (req, res) => {
  const statusCode = Number(req.path.replace(/^\//, '').replace(/\.html$/, '')) || 404;
  const safeStatus = Object.prototype.hasOwnProperty.call(errorPages, statusCode) ? statusCode : 500;
  sendErrorPage(res, safeStatus);
});

app.use(express.static(path.resolve(__dirname, "../../public/dist/html")));
app.use(express.static(path.resolve(__dirname, "../../public/dist")));
app.use(express.static(sourceHtmlDir));
if (USE_MOCK) {
  app.use('/api/mock', mockRouter);
}

app.use('/api', apiRoutes);

app.use((req, res) => {
  if (req.accepts('html')) {
    sendErrorPage(res, 404);
    return;
  }

  res.status(404).json({ error: 'Not found' });
});

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
    ? Number((error as { statusCode: number }).statusCode)
    : 500;

  if (req.accepts('html')) {
    sendErrorPage(res, Object.prototype.hasOwnProperty.call(errorPages, statusCode) ? statusCode : 500);
    return;
  }

  res.status(statusCode).json({ error: statusCode === 403 ? 'Forbidden' : statusCode === 404 ? 'Not found' : statusCode === 503 ? 'Service unavailable' : 'Internal server error' });
});

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

export default app;
