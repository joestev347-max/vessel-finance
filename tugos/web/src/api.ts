// Thin TugOS API client. Token persists in localStorage; every call attaches it.
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';
const TOKEN_KEY = 'tugos_token';

export type Status = 'scheduled' | 'en_route' | 'on_scene' | 'complete' | 'cleared' | 'cancelled';

export interface Vessel { id: string; name: string; official_number: string | null; status: string; created_at: string; }
export interface Client { id: string; name: string; billing_email: string | null; created_at: string; }
export interface Job {
  id: string;
  vessel_id: string | null;
  client_id: string | null;
  status: Status;
  scheduled_at: string | null;
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const t = getToken();
  if (t) headers['authorization'] = `Bearer ${t}`;
  const res = await fetch(BASE + path, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string>) } });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string })?.error ?? res.statusText;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; role: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  listVessels: () => req<{ vessels: Vessel[] }>('/vessels'),
  createVessel: (v: { name: string; official_number?: string }) =>
    req<{ vessel: Vessel }>('/vessels', { method: 'POST', body: JSON.stringify(v) }),
  listClients: () => req<{ clients: Client[] }>('/clients'),
  createClient: (c: { name: string; billing_email?: string }) =>
    req<{ client: Client }>('/clients', { method: 'POST', body: JSON.stringify(c) }),
  listJobs: () => req<{ jobs: Job[] }>('/jobs'),
  createJob: (j: { vessel_id?: string; client_id?: string }) =>
    req<{ job: Job }>('/jobs', { method: 'POST', body: JSON.stringify(j) }),
  setJobStatus: (id: string, status: Status) =>
    req<{ job: Job }>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
