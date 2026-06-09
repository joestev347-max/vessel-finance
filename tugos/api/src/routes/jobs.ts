import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';

export const jobsRouter = Router();
jobsRouter.use(authenticate);

jobsRouter.get('/', asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const jobs = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `select id, vessel_id, client_id, status, scheduled_at, created_at
       from public.tug_jobs order by created_at desc`,
    );
    return r.rows;
  });
  res.json({ jobs });
}));

const createSchema = z.object({
  vessel_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'en_route', 'on_scene', 'complete', 'cleared', 'cancelled']).optional(),
  scheduled_at: z.string().datetime().optional(),
});

jobsRouter.post('/', requireRole('fleet_admin', 'dispatcher'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid job payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { vessel_id, client_id, status, scheduled_at } = parsed.data;
  try {
    const job = await withTenant(auth.companyId, async (c) => {
      const r = await c.query(
        `insert into public.tug_jobs (company_id, vessel_id, client_id, status, scheduled_at)
         values ($1, $2, $3, coalesce($4, 'scheduled'), $5)
         returning id, vessel_id, client_id, status, scheduled_at, created_at`,
        [auth.companyId, vessel_id ?? null, client_id ?? null, status ?? null, scheduled_at ?? null],
      );
      return r.rows[0];
    });
    res.status(201).json({ job });
  } catch (err) {
    // Composite tenant FK: a vessel_id/client_id not in the caller's company
    // raises 23503. Surface as a 400 rather than a 500.
    if ((err as { code?: string }).code === '23503') {
      res.status(400).json({ error: 'vessel_id or client_id does not belong to your company' });
      return;
    }
    throw err;
  }
}));

const statusSchema = z.object({
  status: z.enum(['scheduled', 'en_route', 'on_scene', 'complete', 'cleared', 'cancelled']),
});

// PATCH /jobs/:id — advance a job's status (the dispatch board's core action).
// RLS scopes the UPDATE to the caller's company, so a foreign/unknown id simply
// matches 0 rows -> 404 (no cross-tenant write or info leak).
jobsRouter.patch('/:id', requireRole('fleet_admin', 'dispatcher', 'captain'), asyncHandler(async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'invalid job id' });
    return;
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid status', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const job = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `update public.tug_jobs set status = $1 where id = $2
       returning id, vessel_id, client_id, status, scheduled_at, created_at, updated_at`,
      [parsed.data.status, id.data],
    );
    return r.rows[0] ?? null;
  });
  if (!job) {
    res.status(404).json({ error: 'job not found' });
    return;
  }
  res.json({ job });
}));
