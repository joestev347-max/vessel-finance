// Thin TugOS API client. Auth is a server-set httpOnly cookie (not readable by
// JS), so every request just sends credentials; there is no token in the page.
// BASE is same-origin by default ('' -> relative URLs); dev sets VITE_API_BASE.
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export type Status = 'scheduled' | 'en_route' | 'on_scene' | 'complete' | 'cleared' | 'cancelled';

export interface Vessel { id: string; name: string; official_number: string | null; status: string; created_at: string; }
export interface Client { id: string; name: string; billing_email: string | null; created_at: string; }
export interface Job {
  id: string;
  vessel_id: string | null;
  client_id: string | null;
  status: Status;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
}
export interface CrewMember { id: string; full_name: string; rank: string | null; created_at: string; }
export interface User { id: string; email: string; full_name: string | null; role: string; created_at: string; }

export const ROLES = [
  'fleet_admin', 'port_captain', 'dispatcher', 'captain', 'crew', 'billing', 'client',
] as const;
export type Role = (typeof ROLES)[number];

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const res = await fetch(BASE + path, {
    ...opts,
    credentials: 'include', // send/receive the httpOnly session cookie
    headers: { ...headers, ...(opts.headers as Record<string, string>) },
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string })?.error ?? res.statusText;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ role: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => req<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => req<{ role: string }>('/auth/me'),
  listVessels: () => req<{ vessels: Vessel[] }>('/vessels'),
  createVessel: (v: { name: string; official_number?: string }) =>
    req<{ vessel: Vessel }>('/vessels', { method: 'POST', body: JSON.stringify(v) }),
  listClients: () => req<{ clients: Client[] }>('/clients'),
  createClient: (c: { name: string; billing_email?: string }) =>
    req<{ client: Client }>('/clients', { method: 'POST', body: JSON.stringify(c) }),
  listJobs: () => req<{ jobs: Job[] }>('/jobs'),
  createJob: (j: { vessel_id?: string; client_id?: string; scheduled_at?: string; notes?: string }) =>
    req<{ job: Job }>('/jobs', { method: 'POST', body: JSON.stringify(j) }),
  updateJob: (id: string, patch: { status?: Status; scheduled_at?: string | null; notes?: string | null }) =>
    req<{ job: Job }>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  listCrew: () => req<{ crew: CrewMember[] }>('/crew'),
  createCrew: (c: { full_name: string; rank?: string }) =>
    req<{ crew: CrewMember }>('/crew', { method: 'POST', body: JSON.stringify(c) }),
  listUsers: () => req<{ users: User[] }>('/users'),
  createUser: (u: { email: string; full_name?: string; role: Role; password: string }) =>
    req<{ user: User }>('/users', { method: 'POST', body: JSON.stringify(u) }),
};
