import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { PostgresRateLimitStore } from './rate-limit-store.js';
import { errorHandler } from './http.js';
import { queryNoTenant } from './db.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { vesselsRouter } from './routes/vessels.js';
import { clientsRouter } from './routes/clients.js';
import { crewRouter } from './routes/crew.js';
import { jobsRouter } from './routes/jobs.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Vercel/proxy: needed for correct client IP in rate limiting
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true })); // credentials => cookies
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' })); // cap request bodies

  // Brute-force mitigation on the credential endpoint.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_MAX ?? 10), // tunable for tests/e2e
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many login attempts, please try again later' },
    store: new PostgresRateLimitStore(),
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/debug/db', async (_req, res) => {
    let host = 'unset';
    try { host = new URL(process.env.DATABASE_URL ?? '').host; } catch { /* unparseable */ }
    const sslOn = process.env.PGSSL_NO_VERIFY === '1';
    try {
      const r = await queryNoTenant('select 1 as ok');
      res.json({ db: 'ok', host, sslNoVerify: sslOn, rows: r.rows });
    } catch (e) {
      res.status(500).json({ db: 'error', host, sslNoVerify: sslOn, message: String((e as { message?: string })?.message), code: (e as { code?: string })?.code });
    }
  });
  app.use('/auth/login', loginLimiter);
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/vessels', vesselsRouter);
  app.use('/clients', clientsRouter);
  app.use('/crew', crewRouter);
  app.use('/jobs', jobsRouter);

  // Single-origin deploy: when WEB_DIST is set, this same app also serves the
  // built React SPA, so cookies stay first-party and no CORS is needed. The API
  // routes above are matched first; everything else falls back to index.html.
  const webDist = process.env.WEB_DIST;
  if (webDist) {
    app.use(express.static(webDist));
    app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use(errorHandler); // terminal error handler — must be last

  return app;
}

// Only start listening when run directly (not when imported by tests). Use
// pathToFileURL so the comparison is correct cross-platform (the hand-built
// "file://" + path form does not match import.meta.url on Windows).
const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;
if (isMain) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`TugOS API listening on :${config.port}`);
  });
}
