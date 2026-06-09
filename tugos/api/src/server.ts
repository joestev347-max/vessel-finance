import express from 'express';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { vesselsRouter } from './routes/vessels.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
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
