import 'dotenv/config';

// Read once, fail fast on missing required config — except JWT_SECRET, which is
// read lazily (see auth.ts) so unit tests can set it without a full env.
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  get databaseUrl(): string {
    return required('DATABASE_URL');
  },
  get port(): number {
    return Number(process.env.PORT ?? 3001);
  },
  // CORS allow-list from CORS_ORIGINS (comma-separated). Unset => reflect the
  // request origin (dev convenience). Set it explicitly in production.
  get corsOrigins(): string[] | boolean {
    const v = process.env.CORS_ORIGINS;
    if (!v || v.trim() === '') return true;
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  },
};
