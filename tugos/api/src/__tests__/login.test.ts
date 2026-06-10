process.env.JWT_SECRET = 'test-secret-please-ignore';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginUser, LoginError, type LoginRow } from '../services/login.js';
import { hashPassword, verifyAccessToken } from '../auth.js';

test('valid credentials return a token carrying identity + role', async () => {
  const hash = await hashPassword('pw');
  const lookup = async (): Promise<LoginRow[]> => [
    { id: 'u1', company_id: 'c1', role: 'fleet_admin', password_hash: hash },
  ];
  const { token, user } = await loginUser('a@a.test', 'pw', lookup);
  assert.equal(user.companyId, 'c1');
  assert.deepEqual(verifyAccessToken(token), { userId: 'u1', companyId: 'c1', role: 'fleet_admin' });
});

test('unknown email fails generically', async () => {
  await assert.rejects(() => loginUser('x@x.test', 'pw', async () => []), LoginError);
});

test('email present in two companies is ambiguous -> denied', async () => {
  const hash = await hashPassword('pw');
  const lookup = async (): Promise<LoginRow[]> => [
    { id: 'u1', company_id: 'c1', role: 'crew', password_hash: hash },
    { id: 'u2', company_id: 'c2', role: 'crew', password_hash: hash },
  ];
  await assert.rejects(() => loginUser('dup@x.test', 'pw', lookup), LoginError);
});

test('wrong password fails', async () => {
  const hash = await hashPassword('right');
  const lookup = async (): Promise<LoginRow[]> => [
    { id: 'u1', company_id: 'c1', role: 'crew', password_hash: hash },
  ];
  await assert.rejects(() => loginUser('a@a.test', 'wrong', lookup), LoginError);
});

test('user with no password set cannot log in', async () => {
  const lookup = async (): Promise<LoginRow[]> => [
    { id: 'u1', company_id: 'c1', role: 'crew', password_hash: null },
  ];
  await assert.rejects(() => loginUser('a@a.test', 'pw', lookup), LoginError);
});
