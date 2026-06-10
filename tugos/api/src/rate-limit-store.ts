import type { Options, Store, IncrementResponse } from 'express-rate-limit';
import { queryNoTenant } from './db.js';

// A shared, serverless-correct rate-limit store backed by Postgres
// (private.tug_rate_limit). Fixed-window per key; the window resets once
// expires_at passes. Keyed by client IP by express-rate-limit's default.
export class PostgresRateLimitStore implements Store {
  windowMs = 15 * 60 * 1000;

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const { rows } = await queryNoTenant(
      `insert into private.tug_rate_limit (key, hits, expires_at)
       values ($1, 1, now() + ($2::bigint * interval '1 millisecond'))
       on conflict (key) do update set
         hits = case when private.tug_rate_limit.expires_at <= now() then 1
                     else private.tug_rate_limit.hits + 1 end,
         expires_at = case when private.tug_rate_limit.expires_at <= now()
                           then now() + ($2::bigint * interval '1 millisecond')
                           else private.tug_rate_limit.expires_at end
       returning hits, expires_at`,
      [key, this.windowMs],
    );
    const row = rows[0] as { hits: number; expires_at: string };
    return { totalHits: Number(row.hits), resetTime: new Date(row.expires_at) };
  }

  async decrement(key: string): Promise<void> {
    await queryNoTenant('update private.tug_rate_limit set hits = greatest(hits - 1, 0) where key = $1', [key]);
  }

  async resetKey(key: string): Promise<void> {
    await queryNoTenant('delete from private.tug_rate_limit where key = $1', [key]);
  }
}
