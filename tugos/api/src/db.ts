import pg from 'pg';
import { config } from './config.js';

// A minimal query interface so the tenant-transaction logic can be unit-tested
// with a fake client (no live DB needed).
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

// THE tenant-scoping contract. Every tenant request runs inside one transaction
// that first sets app.company_id (transaction-local), which is exactly what the
// RLS policies read via tug_current_company_id(). Because the connection role
// (tug_api) does NOT bypass RLS, a missing/forged company id can only ever see
// fewer rows, never another tenant's. set_config(..., true) = LOCAL to this tx.
export async function tenantTransaction<T>(
  client: Queryable,
  companyId: string,
  fn: (client: Queryable) => Promise<T>,
): Promise<T> {
  await client.query('begin');
  try {
    await client.query("select set_config('app.company_id', $1, true)", [companyId]);
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  }
}

// Lazily-created pool so importing this module (e.g. in tests) doesn't require
// DATABASE_URL until an actual connection is needed.
let pool: pg.Pool | undefined;
function getPool(): pg.Pool {
  if (!pool) {
    // Supabase requires SSL. PGSSL_NO_VERIFY=1 disables cert verification
    // (dev/spike convenience); leave it off in production and trust the CA.
    const ssl = process.env.PGSSL_NO_VERIFY === '1' ? { rejectUnauthorized: false } : undefined;
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl,
      connectionTimeoutMillis: 15_000,
    });
    // Without this listener, a pool/connection error is emitted as an unhandled
    // 'error' event and crashes the process (an empty 500 on serverless).
    pool.on('error', (err) => {
      console.error('pg pool error:', err.message);
    });
  }
  return pool;
}

// Acquire a pooled connection and run fn within a tenant-scoped transaction.
export async function withTenant<T>(
  companyId: string,
  fn: (client: Queryable) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await tenantTransaction(client, companyId, fn);
  } finally {
    client.release();
  }
}

// Connection WITHOUT a tenant scope. Only safe for SECURITY DEFINER functions
// (e.g. login lookup) that intentionally bypass RLS — any direct tug_ table read
// here returns zero rows by deny-by-default, which is the safe failure mode.
export async function queryNoTenant(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: any[] }> {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
