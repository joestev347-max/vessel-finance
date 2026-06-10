process.env.JWT_SECRET = 'test-secret-please-ignore';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware.js';
import { signAccessToken } from '../auth.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(c: number) { res.statusCode = c; return res; },
    json(b: unknown) { res.body = b; return res; },
  };
  return res;
}

test('authenticate: missing header -> 401, no next', () => {
  const res = mockRes();
  let nexted = false;
  authenticate({ headers: {} } as Request, res as unknown as Response, (() => { nexted = true; }) as NextFunction);
  assert.equal(res.statusCode, 401);
  assert.equal(nexted, false);
});

test('authenticate: valid token sets req.auth and calls next', () => {
  const token = signAccessToken({ userId: 'u1', companyId: 'c1', role: 'dispatcher' });
  const req = { headers: { authorization: `Bearer ${token}` } } as Request;
  const res = mockRes();
  let nexted = false;
  authenticate(req, res as unknown as Response, (() => { nexted = true; }) as NextFunction);
  assert.equal(nexted, true);
  assert.deepEqual(req.auth, { userId: 'u1', companyId: 'c1', role: 'dispatcher' });
});

test('authenticate: bad token -> 401', () => {
  const res = mockRes();
  let nexted = false;
  authenticate({ headers: { authorization: 'Bearer not-a-jwt' } } as Request, res as unknown as Response, (() => { nexted = true; }) as NextFunction);
  assert.equal(res.statusCode, 401);
  assert.equal(nexted, false);
});

test('requireRole: allowed role calls next', () => {
  const mw = requireRole('fleet_admin', 'dispatcher');
  const res = mockRes();
  let nexted = false;
  mw({ auth: { userId: 'u', companyId: 'c', role: 'dispatcher' } } as Request, res as unknown as Response, (() => { nexted = true; }) as NextFunction);
  assert.equal(nexted, true);
});

test('requireRole: disallowed role -> 403', () => {
  const mw = requireRole('fleet_admin');
  const res = mockRes();
  let nexted = false;
  mw({ auth: { userId: 'u', companyId: 'c', role: 'crew' } } as Request, res as unknown as Response, (() => { nexted = true; }) as NextFunction);
  assert.equal(res.statusCode, 403);
  assert.equal(nexted, false);
});

test('requireRole: unauthenticated -> 401', () => {
  const mw = requireRole('fleet_admin');
  const res = mockRes();
  mw({} as Request, res as unknown as Response, (() => {}) as NextFunction);
  assert.equal(res.statusCode, 401);
});
