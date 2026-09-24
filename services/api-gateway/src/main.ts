import express, { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');

const ROUTES: Array<{ target: string; prefixes: string[] }> = [
  { target: process.env.AUTH_SERVICE_URL ?? 'http://auth-service:4001', prefixes: ['/auth'] },
  { target: process.env.USER_SERVICE_URL ?? 'http://user-service:4002', prefixes: ['/users'] },
  { target: process.env.POST_SERVICE_URL ?? 'http://post-service:4003', prefixes: ['/posts'] },
  {
    target: process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:4005',
    prefixes: ['/notifications', '/messages', '/stories'],
  },
];

const PUBLIC_PATHS = new Set(['/auth/login', '/auth/register', '/auth/logout']);

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('access_token='));
  return cookie ? decodeURIComponent(cookie.slice('access_token='.length)) : null;
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  delete req.headers['x-user-id'];
  const token = readToken(req);
  if (token) {
    try {
      const { sub } = jwt.verify(token, JWT_SECRET!) as JwtPayload;
      if (typeof sub === 'string') req.headers['x-user-id'] = sub;
    } catch {
      delete req.headers.authorization;
    }
  }
  if (!req.headers['x-user-id'] && !PUBLIC_PATHS.has(req.path)) {
    res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    return;
  }
  next();
}

const app = express();
app.disable('x-powered-by');
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use(authenticate);
for (const { target, prefixes } of ROUTES) {
  app.use(createProxyMiddleware({ target, pathFilter: prefixes, xfwd: true, proxyTimeout: 60_000 }));
}
app.use((_req, res) => {
  res.status(404).json({ statusCode: 404, message: 'Not Found' });
});

const server = app.listen(Number(process.env.PORT ?? 3051));
process.on('SIGTERM', () => server.close());
