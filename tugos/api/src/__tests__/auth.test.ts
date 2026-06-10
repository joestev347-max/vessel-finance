process.env.JWT_SECRET = 'test-secret-please-ignore';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from '../auth.js';

test('password hash round-trips and rejects wrong password', async () => {
  const hash = await hashPassword('s3cret-pw');
  assert.notEqual(hash, 's3cret-pw');
  assert.equal(await verifyPassword('s3cret-pw', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
});

test('verifyPassword returns false on empty hash', async () => {
  assert.equal(await verifyPassword('anything', ''), false);
});

test('access token round-trips identity + role', () => {
  const ctx = { userId: 'u1', companyId: 'c1', role: 'dispatcher' as const };
  const token = signAccessToken(ctx);
  assert.deepEqual(verifyAccessToken(token), ctx);
});

test('token verification fails under a different secret', () => {
  const token = signAccessToken({ userId: 'u', companyId: 'c', role: 'crew' });
  process.env.JWT_SECRET = 'a-different-secret';
  assert.throws(() => verifyAccessToken(token));
  process.env.JWT_SECRET = 'test-secret-please-ignore';
});
