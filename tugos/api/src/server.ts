import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { vesselsRouter } from './routes/vessels.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Vercel/proxy: needed for correct client IP in rate limiting
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' })); // cap request bodies

  // Brute-force mitigation on the credential endpoint.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many login attempts, please try again later' },
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth/login', loginLimiter);
  app.use('/auth', authRouter);
  app.use('/vessels', vesselsRouter);

  return app;
}

// Only start listening when run directly (not when imported by tests).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMain) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`TugOS API listening on :${config.port}`);
  });
}
