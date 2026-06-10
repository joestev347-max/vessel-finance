import { Router } from 'express';
import { z } from 'zod';
import { loginUser, LoginError } from '../services/login.js';
import { authenticate } from '../middleware.js';
import { asyncHandler } from '../http.js';
import { config, SESSION_COOKIE, SESSION_MAX_AGE_MS } from '../config.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd, // HTTPS-only in production
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  try {
    const { token, user } = await loginUser(parsed.data.email, parsed.data.password);
    setSessionCookie(res, token);
    res.json({ role: user.role }); // token is in the httpOnly cookie, not the body
  } catch (err) {
    if (err instanceof LoginError) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    console.error('login error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// Session probe for the SPA: 200 + role if the cookie is valid, else 401.
authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ role: req.auth!.role });
}));
