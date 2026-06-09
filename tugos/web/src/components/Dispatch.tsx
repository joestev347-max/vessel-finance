import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError, type Client, type Job, type Status, type Vessel } from '../api.ts';

const COLUMNS: { status: Status; label: string }[] = [
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'en_route', label: 'En route' },
  { status: 'on_scene', label: 'On scene' },
  { status: 'complete', label: 'Complete' },
];

// Allowed forward transitions surfaced as buttons on each job card.
const NEXT: Record<Status, Status[]> = {
  scheduled: ['en_route', 'cancelled'],
  en_route: ['on_scene'],
  on_scene: ['complete'],
  complete: ['cleared'],
  cleared: [],
  cancelled: [],
};

const STATUS_LABEL: Record<Status, string> = {
  scheduled: 'Scheduled',
  en_route: 'En route',
  on_scene: 'On scene',
  complete: 'Complete',
  cleared: 'Cleared',
  cancelled: 'Cancelled',
};

export function Dispatch({ onError, onLogout }: { onError: (m: string) => void; onLogout: () => void }) {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const vesselName = useMemo(() => new Map(vessels.map((v) => [v.id, v.name])), [vessels]);
  const clientName = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const reload = useCallback(async () => {
    onError('');
    try {
      const [v, c, j] = await Promise.all([api.listVessels(), api.listClients(), api.listJobs()]);
      setVessels(v.vessels);
      setClients(c.clients);
      setJobs(j.jobs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      onError(err instanceof Error ? err.message : 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [onError, onLogout]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function transition(id: string, status: Status) {
    try {
      await api.setJobStatus(id, status);
      await reload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'update failed');
    }
  }

  return (
    <div>
      <NewJobForm vessels={vessels} clients={clients} onCreated={reload} onError={onError} />

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.status);
            return (
              <section key={col.status} className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-slate-700">
                <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {col.label}
                  <span className="rounded-full bg-slate-700 px-2 text-xs text-slate-300">{colJobs.length}</span>
                </h2>
                <div className="space-y-2">
                  {colJobs.map((job) => (
                    <article key={job.id} className="rounded-md bg-slate-900 p-3 ring-1 ring-slate-700">
                      <p className="font-medium text-white">{job.vessel_id ? vesselName.get(job.vessel_id) ?? 'Unknown vessel' : 'Unassigned vessel'}</p>
                      <p className="text-xs text-slate-400">{job.client_id ? clientName.get(job.client_id) ?? 'Unknown client' : 'No client'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {NEXT[job.status].map((next) => (
                          <button
                            key={next}
                            onClick={() => void transition(job.id, next)}
                            className="rounded bg-sky-700 px-2 py-1 text-xs text-white hover:bg-sky-600"
                          >
                            → {STATUS_LABEL[next]}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                  {colJobs.length === 0 && <p className="text-xs text-slate-500">No jobs</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewJobForm({
  vessels,
  clients,
  onCreated,
  onError,
}: {
  vessels: Vessel[];
  clients: Client[];
  onCreated: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [vesselId, setVesselId] = useState('');
  const [clientId, setClientId] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError('');
    try {
      await api.createJob({
        vessel_id: vesselId || undefined,
        client_id: clientId || undefined,
      });
      setVesselId('');
      setClientId('');
      await onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'could not create job');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-slate-800/60 p-4 ring-1 ring-slate-700">
      <label className="text-sm">
        <span className="text-slate-300">Vessel</span>
        <select value={vesselId} onChange={(e) => setVesselId(e.target.value)} className="mt-1 block rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700">
          <option value="">— select —</option>
          {vessels.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="text-slate-300">Client</span>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 block rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700">
          <option value="">— none —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={busy} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
        {busy ? 'Adding…' : 'New job'}
      </button>
    </form>
  );
}
