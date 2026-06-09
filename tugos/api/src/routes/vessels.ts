import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';

export const vesselsRouter = Router();
vesselsRouter.use(authenticate);

vesselsRouter.get('/', asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const vessels = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      'select id, name, official_number, status, created_at from public.tug_vessels order by name',
    );
    return r.rows;
  });
  res.json({ vessels });
}));

const createSchema = z.object({
  name: z.string().min(1).max(200),
  official_number: z.string().max(50).optional(),
  status: z.enum(['active', 'maintenance', 'laid_up', 'retired']).optional(),
});

vesselsRouter.post('/', requireRole('fleet_admin', 'port_captain'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid vessel payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { name, official_number, status } = parsed.data;
  const vessel = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `insert into public.tug_vessels (company_id, name, official_number, status)
       values ($1, $2, $3, coalesce($4, 'active'))
       returning id, name, official_number, status, created_at`,
      [auth.companyId, name, official_number ?? null, status ?? null],
    );
    return r.rows[0];
  });
  res.status(201).json({ vessel });
}));
