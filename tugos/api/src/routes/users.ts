import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';
import { hashPassword } from '../auth.js';
import { ROLES } from '../types.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

const roleEnum = z.enum(ROLES as unknown as [string, ...string[]]);

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().max(200).optional(),
  role: roleEnum,
  password: z.string().min(8).max(200),
});

// List users in the caller's company (no password material).
usersRouter.get('/', requireRole('fleet_admin', 'port_captain'), asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const users = await withTenant(auth.companyId, async (c) => {
    const r = await c.query('select id, email, full_name, role, created_at from public.tug_users order by email');
    return r.rows;
  });
  res.json({ users });
}));

// Provision a user (fleet admins only). Password is hashed in-process; only the
// hash is stored, and the row is tenant-stamped + re-checked by RLS WITH CHECK.
usersRouter.post('/', requireRole('fleet_admin'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid user payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { email, full_name, role, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  try {
    const user = await withTenant(auth.companyId, async (c) => {
      const r = await c.query(
        `insert into public.tug_users (company_id, email, full_name, role, password_hash)
         values ($1, $2, $3, $4, $5)
         returning id, email, full_name, role, created_at`,
        [auth.companyId, email, full_name ?? null, role, passwordHash],
      );
      return r.rows[0];
    });
    res.status(201).json({ user });
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'a user with that email already exists in this company' });
      return;
    }
    throw err;
  }
}));
