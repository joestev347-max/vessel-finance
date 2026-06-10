import { test, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

function initOf(mock: ReturnType<typeof vi.fn>): RequestInit {
  const call = mock.mock.calls[0];
  return (call?.[1] ?? {}) as RequestInit;
}

test('sends the session cookie (credentials: include) and parses the body', async () => {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify({ vessels: [] }), { status: 200 })),
  );
  vi.stubGlobal('fetch', fetchMock);
  await api.listVessels();
  expect(initOf(fetchMock).credentials).toBe('include');
});

test('throws ApiError with the server status on a non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(JSON.stringify({ error: 'nope' }), { status: 401 }))));
  await expect(api.listJobs()).rejects.toBeInstanceOf(ApiError);
});

test('me() probes /auth/me', async () => {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify({ role: 'dispatcher' }), { status: 200 })),
  );
  vi.stubGlobal('fetch', fetchMock);
  const r = await api.me();
  expect(r.role).toBe('dispatcher');
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/auth/me');
});
