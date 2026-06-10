import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as tick } from 'node:timers/promises';
import type { NextFunction, Request, Response } from 'express';
import { asyncHandler, errorHandler } from '../http.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(c: number) { res.statusCode = c; return res; },
    json(b: unknown) { res.body = b; return res; },
  };
  return res;
}

test('asyncHandler forwards a rejected promise to next', async () => {
  let captured: unknown;
  const h = asyncHandler(async () => { throw new Error('boom'); });
  h({} as Request, mockRes() as unknown as Response, ((e: unknown) => { captured = e; }) as NextFunction);
  await tick(0);
  assert.ok(captured instanceof Error);
  assert.equal((captured as Error).message, 'boom');
});

test('asyncHandler does not call next when the handler resolves', async () => {
  let called = false;
  const h = asyncHandler(async () => { /* ok */ });
  h({} as Request, mockRes() as unknown as Response, (() => { called = true; }) as NextFunction);
  await tick(0);
  assert.equal(called, false);
});

test('errorHandler maps oversized body to 413', () => {
  const res = mockRes();
  errorHandler({ type: 'entity.too.large' }, {} as Request, res as unknown as Response, (() => {}) as NextFunction);
  assert.equal(res.statusCode, 413);
});

test('errorHandler maps unknown errors to 500', () => {
  const res = mockRes();
  errorHandler(new Error('unexpected'), {} as Request, res as unknown as Response, (() => {}) as NextFunction);
  assert.equal(res.statusCode, 500);
});
