import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

clientsRouter.get('/', asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const clients = await withTenant(auth.companyId, async (c) => {
    const r = await c.query('select id, name, billing_email, created_at from public.tug_clients order by name');
    return r.rows;
  });
  res.json({ clients });
}));

const createSchema = z.object({
  name: z.string().min(1).max(200),
  billing_email: z.string().email().optional(),
});

clientsRouter.post('/', requireRole('fleet_admin', 'dispatcher', 'billing'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid client payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { name, billing_email } = parsed.data;
  const client = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `insert into public.tug_clients (company_id, name, billing_email)
       values ($1, $2, $3)
       returning id, name, billing_email, created_at`,
      [auth.companyId, name, billing_email ?? null],
    );
    return r.rows[0];
  });
  res.status(201).json({ client });
}));
