// Headless browser e2e for the TugOS dispatch + fleet UI against a LIVE API/DB.
// Credentials come from the environment (no secrets in source):
//   DATABASE_URL, JWT_SECRET, PGSSL_NO_VERIFY, DEMO_EMAIL, DEMO_PASSWORD
// It spawns the API (tugos/api) and serves the built web app (npm run build first),
// then drives a headless Chromium through login -> fleet setup -> dispatch.
// Run via: npm run e2e:ui   (with the env vars set; see tugos/web/README.md)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(fileURLToPath(import.meta.url)).replace(/[\\/]e2e$/, '');
const API = path.resolve(WEB, '..', 'api');
const SHOTS = path.join(WEB, 'e2e', 'shots');
mkdirSync(SHOTS, { recursive: true });

const EMAIL = process.env.DEMO_EMAIL ?? 'captain@demo.test';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'DemoPass123!';

const results = [];
let failures = 0;
const check = (name, cond, extra = '') => {
  if (cond) results.push('PASS ' + name);
  else { failures++; results.push('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
};

if (!process.env.DATABASE_URL) {
  console.log('SKIP: DATABASE_URL not set (see README). No live e2e run.');
  process.exit(2);
}

const apiEnv = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: '3001',
  JWT_SECRET: process.env.JWT_SECRET ?? 'uiverify-secret-change-me',
};
const apiProc = spawn(process.execPath, [path.join(API, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(API, 'src', 'server.ts')], { cwd: API, env: apiEnv });
const webProc = spawn(process.execPath, [path.join(WEB, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', '4173', '--strictPort'], { cwd: WEB, env: { ...process.env } });
apiProc.stderr.on('data', (d) => process.stdout.write('[api] ' + d));
webProc.stderr.on('data', (d) => process.stdout.write('[web] ' + d));

async function waitFor(url, label, tries = 70) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.status < 500) return true; } catch { /* not up */ }
    await sleep(500);
  }
  throw new Error('timeout waiting for ' + label);
}

let browser;
try {
  await waitFor('http://localhost:3001/health', 'api');
  await waitFor('http://localhost:4173/', 'web');
  browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('button', { name: 'Dispatch' }).waitFor({ timeout: 15000 });
  check('logged in (nav visible)', true);

  // Fleet setup: add a vessel and a client via the UI.
  await page.getByRole('button', { name: 'Fleet' }).click();
  const vessels = page.locator('section', { hasText: 'Vessels' });
  await vessels.locator('input').first().fill('E2E Tug');
  await page.getByRole('button', { name: 'Add vessel' }).click();
  await vessels.locator('text=E2E Tug').waitFor({ timeout: 15000 });
  check('added vessel via Fleet UI', true);

  const clients = page.locator('section', { hasText: 'Clients' });
  await clients.locator('input').first().fill('E2E Client');
  await page.getByRole('button', { name: 'Add client' }).click();
  await clients.locator('text=E2E Client').waitFor({ timeout: 15000 });
  check('added client via Fleet UI', true);
  await page.screenshot({ path: path.join(SHOTS, 'fleet.png') });

  // Dispatch: create a job from the new vessel + client, then advance it.
  await page.getByRole('button', { name: 'Dispatch' }).click();
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ label: 'E2E Tug' });
  await selects.nth(1).selectOption({ label: 'E2E Client' });
  await page.getByRole('button', { name: /new job/i }).click();
  await page.waitForSelector('article:has-text("E2E Tug")', { timeout: 15000 });
  check('job created on board', true);

  await page.getByRole('button', { name: /En route/i }).first().click();
  await page.waitForTimeout(1500);
  const moved = await page.locator('section:has-text("En route") article:has-text("E2E Tug")').count();
  check('job moved to En route', moved > 0, 'count=' + moved);
  await page.screenshot({ path: path.join(SHOTS, 'dispatch.png') });

  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
} catch (err) {
  failures++;
  results.push('FAIL exception :: ' + (err?.message ?? String(err)));
} finally {
  if (browser) await browser.close();
  apiProc.kill();
  webProc.kill();
}

console.log(results.join('\n'));
console.log('UIVERIFY_FAILURES=' + failures);
process.exit(failures === 0 ? 0 : 1);
