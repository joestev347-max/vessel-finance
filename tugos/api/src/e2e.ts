// End-to-end smoke against the LIVE Supabase project. Starts the real Express
// app, hits it over HTTP, exercises login + vessels as the demo user. Not part
// of the unit-test suite; run manually with a tug_api DATABASE_URL.
import type { AddressInfo } from 'node:net';
import { createApp } from './server.js';
import { closePool } from './db.js';

const results: string[] = [];
let failures = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) results.push('PASS ' + name);
  else {
    failures++;
    results.push('FAIL ' + name + (extra ? ' :: ' + extra : ''));
  }
}

const app = createApp();
const server = app.listen(0);
await new Promise<void>((resolve) => server.on('listening', () => resolve()));
const port = (server.address() as AddressInfo).port;
const base = `http://127.0.0.1:${port}`;

try {
  let r = await fetch(`${base}/health`);
  check('GET /health -> 200', r.status === 200, `status=${r.status}`);

  r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'captain@demo.test', password: 'wrong-password' }),
  });
  check('login with wrong password -> 401', r.status === 401, `status=${r.status}`);

  r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'captain@demo.test', password: 'DemoPass123!' }),
  });
  const login = (await r.json()) as { token?: string; role?: string };
  check('login -> 200', r.status === 200, `status=${r.status} body=${JSON.stringify(login)}`);
  check('login returns fleet_admin role', login.role === 'fleet_admin', `role=${login.role}`);
  const token = login.token ?? '';
  check('login returns a token', token.length > 0);
  const auth = { authorization: `Bearer ${token}` };

  r = await fetch(`${base}/vessels`);
  check('GET /vessels without token -> 401', r.status === 401, `status=${r.status}`);

  r = await fetch(`${base}/vessels`, { headers: auth });
  let body = (await r.json()) as { vessels?: unknown[] };
  check('GET /vessels -> 200', r.status === 200, `status=${r.status}`);
  check('vessels initially empty for demo company', Array.isArray(body.vessels) && body.vessels.length === 0, `len=${body.vessels?.length}`);

  r = await fetch(`${base}/vessels`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...auth },
    body: JSON.stringify({ name: 'Demo Tug Alpha', official_number: 'TG-0001' }),
  });
  const created = (await r.json()) as { vessel?: { id?: string; name?: string } };
  check('POST /vessels -> 201', r.status === 201, `status=${r.status} body=${JSON.stringify(created)}`);
  check('created vessel echoes name', created.vessel?.name === 'Demo Tug Alpha');

  r = await fetch(`${base}/vessels`, { headers: auth });
  body = (await r.json()) as { vessels?: unknown[] };
  check('GET /vessels now returns exactly 1', body.vessels?.length === 1, `len=${body.vessels?.length}`);
} catch (err) {
  failures++;
  results.push('FAIL exception :: ' + (err as Error).message);
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closePool();
}

console.log(results.join('\n'));
console.log('E2E_FAILURES=' + failures);
process.exit(failures === 0 ? 0 : 1);
