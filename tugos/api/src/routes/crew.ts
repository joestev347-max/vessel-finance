import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';

export const crewRouter = Router();
crewRouter.use(authenticate);

crewRouter.get('/', asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const crew = await withTenant(auth.companyId, async (c) => {
    const r = await c.query('select id, full_name, rank, created_at from public.tug_crew order by full_name');
    return r.rows;
  });
  res.json({ crew });
}));

const createSchema = z.object({
  full_name: z.string().min(1).max(200),
  rank: z.string().max(100).optional(),
});

crewRouter.post('/', requireRole('fleet_admin', 'port_captain'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid crew payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { full_name, rank } = parsed.data;
  const member = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `insert into public.tug_crew (company_id, full_name, rank)
       values ($1, $2, $3)
       returning id, full_name, rank, created_at`,
      [auth.companyId, full_name, rank ?? null],
    );
    return r.rows[0];
  });
  res.status(201).json({ crew: member });
}));
