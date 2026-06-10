import { test, expect, vi, beforeEach } from 'vitest';
import { api, ApiError, setToken, clearToken } from '../api.ts';

beforeEach(() => {
  clearToken();
  vi.restoreAllMocks();
});

function headersOf(mock: ReturnType<typeof vi.fn>): Record<string, string> {
  const call = mock.mock.calls[0];
  const init = (call?.[1] ?? {}) as RequestInit;
  return (init.headers ?? {}) as Record<string, string>;
}

test('attaches the bearer token and parses the body', async () => {
  setToken('tok123');
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify({ vessels: [{ id: '1', name: 'A', official_number: null, status: 'active', created_at: '' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);

  const r = await api.listVessels();
  expect(r.vessels).toHaveLength(1);
  expect(headersOf(fetchMock).authorization).toBe('Bearer tok123');
});

test('throws ApiError with the server status on a non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(JSON.stringify({ error: 'nope' }), { status: 401 }))));
  await expect(api.listJobs()).rejects.toBeInstanceOf(ApiError);
});

test('omits the auth header when no token is set', async () => {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(JSON.stringify({ clients: [] }), { status: 200 })));
  vi.stubGlobal('fetch', fetchMock);
  await api.listClients();
  expect(headersOf(fetchMock).authorization).toBeUndefined();
});
