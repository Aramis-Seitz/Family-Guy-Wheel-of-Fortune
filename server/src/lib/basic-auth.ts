import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

const REALM = 'Wheeel';
const WWW_AUTHENTICATE = `Basic realm="${REALM}"`;
const UNAUTHORIZED_BODY = 'Unauthorized';

function getExpectedCredentials(): { user: string; pass: string } | undefined {
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PWD;
  if (!user || !pass) return undefined;
  return { user, pass };
}

export function isBasicAuthAuthorized(authHeader: string | undefined): boolean {
  const expected = getExpectedCredentials();
  // Keine Zugangsdaten konfiguriert (z.B. lokale Entwicklung) -> nicht schuetzen.
  if (!expected) return true;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  return user === expected.user && pass === expected.pass;
}

export function requireBasicAuthVercel(request: Request): Response | undefined {
  const authHeader = request.headers.get('authorization') ?? undefined;
  if (isBasicAuthAuthorized(authHeader)) {
    return undefined;
  }

  return new Response(UNAUTHORIZED_BODY, {
    status: 401,
    headers: { 'WWW-Authenticate': WWW_AUTHENTICATE },
  });
}

export function requireBasicAuthExpress(req: ExpressRequest, res: ExpressResponse, next: NextFunction): void {
  if (isBasicAuthAuthorized(req.headers.authorization)) {
    next();
    return;
  }
  res.setHeader('WWW-Authenticate', WWW_AUTHENTICATE);
  res.status(401).send(UNAUTHORIZED_BODY);
}
