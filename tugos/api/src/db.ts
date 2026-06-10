import postgres from 'postgres';
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

// porsager/postgres: a pure-JS driver that bundles cleanly on serverless.
// prepare:false is REQUIRED for Supabase's transaction pooler (Supavisor) — it
// doesn't support named prepared statements. Lazily created so importing this
// module (e.g. in unit tests) doesn't need DATABASE_URL.
let sql: ReturnType<typeof postgres> | undefined;
function getSql() {
  if (!sql) {
    const ssl = process.env.PGSSL_NO_VERIFY === '1' ? { rejectUnauthorized: false } : ('require' as const);
    sql = postgres(config.databaseUrl, {
      ssl,
      prepare: false,
      connect_timeout: 15,
      idle_timeout: 20,
      max: 5,
    });
  }
  return sql;
}

function rowsShim(run: (text: string, params: unknown[]) => Promise<unknown[]>): Queryable {
  return { query: async (text, params = []) => ({ rows: (await run(text, params)) as any[] }) };
}

// Acquire a dedicated connection and run fn within a tenant-scoped transaction.
export async function withTenant<T>(
  companyId: string,
  fn: (client: Queryable) => Promise<T>,
): Promise<T> {
  const reserved = await getSql().reserve();
  try {
    const client = rowsShim((text, params) => reserved.unsafe(text, params as never[]));
    return await tenantTransaction(client, companyId, fn);
  } finally {
    reserved.release();
  }
}

// Connection WITHOUT a tenant scope. Only safe for SECURITY DEFINER functions
// (e.g. login lookup) that intentionally bypass RLS — any direct tug_ table read
// here returns zero rows by deny-by-default, which is the safe failure mode.
export async function queryNoTenant(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: any[] }> {
  const rows = await getSql().unsafe(text, params as never[]);
  return { rows: rows as any[] };
}

export async function closePool(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = undefined;
  }
}
