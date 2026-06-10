import { Router } from 'express';
import { z } from 'zod';
import { withTenant } from '../db.js';
import { authenticate, requireRole } from '../middleware.js';
import { asyncHandler } from '../http.js';

export const jobsRouter = Router();
jobsRouter.use(authenticate);

const JOB_COLUMNS = 'id, vessel_id, client_id, status, scheduled_at, notes, created_at, updated_at';
const statusEnum = z.enum(['scheduled', 'en_route', 'on_scene', 'complete', 'cleared', 'cancelled']);

jobsRouter.get('/', asyncHandler(async (req, res) => {
  const auth = req.auth!;
  const jobs = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(`select ${JOB_COLUMNS} from public.tug_jobs order by created_at desc`);
    return r.rows;
  });
  res.json({ jobs });
}));

const createSchema = z.object({
  vessel_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  status: statusEnum.optional(),
  scheduled_at: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

jobsRouter.post('/', requireRole('fleet_admin', 'dispatcher'), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid job payload', details: parsed.error.flatten() });
    return;
  }
  const auth = req.auth!;
  const { vessel_id, client_id, status, scheduled_at, notes } = parsed.data;
  try {
    const job = await withTenant(auth.companyId, async (c) => {
      const r = await c.query(
        `insert into public.tug_jobs (company_id, vessel_id, client_id, status, scheduled_at, notes)
         values ($1, $2, $3, coalesce($4, 'scheduled'), $5, $6)
         returning ${JOB_COLUMNS}`,
        [auth.companyId, vessel_id ?? null, client_id ?? null, status ?? null, scheduled_at ?? null, notes ?? null],
      );
      return r.rows[0];
    });
    res.status(201).json({ job });
  } catch (err) {
    if ((err as { code?: string }).code === '23503') {
      res.status(400).json({ error: 'vessel_id or client_id does not belong to your company' });
      return;
    }
    throw err;
  }
}));

// Partial update: any subset of status / scheduled_at / notes. scheduled_at and
// notes accept null to clear. RLS scopes the UPDATE so a foreign/unknown id -> 404.
const patchSchema = z
  .object({
    status: statusEnum.optional(),
    scheduled_at: z.string().datetime().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((o) => o.status !== undefined || o.scheduled_at !== undefined || o.notes !== undefined, {
    message: 'provide at least one of status, scheduled_at, notes',
  });

jobsRouter.patch('/:id', requireRole('fleet_admin', 'dispatcher', 'captain'), asyncHandler(async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: 'invalid job id' });
    return;
  }
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid job update', details: parsed.error.flatten() });
    return;
  }
  // Build a parametrized SET clause over whitelisted columns only.
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const d = parsed.data;
  if (d.status !== undefined) { sets.push(`status = $${i++}`); vals.push(d.status); }
  if (d.scheduled_at !== undefined) { sets.push(`scheduled_at = $${i++}`); vals.push(d.scheduled_at); }
  if (d.notes !== undefined) { sets.push(`notes = $${i++}`); vals.push(d.notes); }
  vals.push(id.data);

  const auth = req.auth!;
  const job = await withTenant(auth.companyId, async (c) => {
    const r = await c.query(
      `update public.tug_jobs set ${sets.join(', ')} where id = $${i} returning ${JOB_COLUMNS}`,
      vals,
    );
    return r.rows[0] ?? null;
  });
  if (!job) {
    res.status(404).json({ error: 'job not found' });
    return;
  }
  res.json({ job });
}));
