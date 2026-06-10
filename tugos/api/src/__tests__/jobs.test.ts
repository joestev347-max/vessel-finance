import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildJobPatch } from '../routes/jobs.js';

test('buildJobPatch: status only', () => {
  const r = buildJobPatch({ status: 'en_route' });
  assert.equal(r.setSql, 'status = $1');
  assert.deepEqual(r.values, ['en_route']);
});

test('buildJobPatch: scheduled_at + notes, with null to clear', () => {
  const r = buildJobPatch({ scheduled_at: null, notes: 'pilot aboard' });
  assert.equal(r.setSql, 'scheduled_at = $1, notes = $2');
  assert.deepEqual(r.values, [null, 'pilot aboard']);
});

test('buildJobPatch: all three keep a fixed positional order', () => {
  const r = buildJobPatch({ status: 'complete', scheduled_at: '2026-01-01T00:00:00.000Z', notes: 'x' });
  assert.equal(r.setSql, 'status = $1, scheduled_at = $2, notes = $3');
  assert.deepEqual(r.values, ['complete', '2026-01-01T00:00:00.000Z', 'x']);
});

test('buildJobPatch: empty input yields empty clause', () => {
  const r = buildJobPatch({});
  assert.equal(r.setSql, '');
  assert.deepEqual(r.values, []);
});
