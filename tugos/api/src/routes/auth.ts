import { Router } from 'express';
import { z } from 'zod';
import { loginUser, LoginError } from '../services/login.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  try {
    const { token, user } = await loginUser(parsed.data.email, parsed.data.password);
    res.json({ token, role: user.role });
  } catch (err) {
    if (err instanceof LoginError) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    console.error('login error', err);
    res.status(500).json({ error: 'internal error' });
  }
});
