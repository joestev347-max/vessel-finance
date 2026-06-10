import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './auth.js';
import { SESSION_COOKIE } from './config.js';
import type { AuthContext, Role } from './types.js';

// Augment Express Request with the verified identity.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Prefer the httpOnly session cookie; fall back to a Bearer header (API clients/tests).
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const cookieToken = cookies?.[SESSION_COOKIE];
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;
  const token = cookieToken ?? bearer;
  if (!token) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
}

// Role gate. Use after authenticate. The DB still enforces tenant isolation via
// RLS regardless of this check — this is defense in depth at the API layer.
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'not authenticated' });
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ error: 'insufficient role' });
      return;
    }
    next();
  };
}
