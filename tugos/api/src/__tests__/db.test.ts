import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tenantTransaction, type Queryable } from '../db.js';

function fakeClient() {
  const calls: { text: string; params?: unknown[] }[] = [];
  const client: Queryable = {
    async query(text: string, params?: unknown[]) {
      calls.push({ text, params });
      return { rows: [] };
    },
  };
  return { client, calls };
}

test('tenantTransaction wraps in a tx and sets app.company_id (local) before the callback', async () => {
  const { client, calls } = fakeClient();
  const out = await tenantTransaction(client, 'company-123', async (c) => {
    await c.query('select 1');
    return 'ok';
  });
  assert.equal(out, 'ok');
  assert.equal(calls[0]!.text, 'begin');
  assert.match(calls[1]!.text, /set_config\('app\.company_id', \$1, true\)/);
  assert.deepEqual(calls[1]!.params, ['company-123']);
  assert.equal(calls[2]!.text, 'select 1');
  assert.equal(calls[3]!.text, 'commit');
});

test('tenantTransaction rolls back and rethrows on error (never commits)', async () => {
  const { client, calls } = fakeClient();
  await assert.rejects(
    () => tenantTransaction(client, 'c', async () => {
      throw new Error('boom');
    }),
    /boom/,
  );
  const texts = calls.map((c) => c.text);
  assert.ok(texts.includes('rollback'), 'should roll back');
  assert.ok(!texts.includes('commit'), 'must not commit on error');
});
