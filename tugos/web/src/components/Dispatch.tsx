import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError, type Client, type Job, type Status, type Vessel } from '../api.ts';

const COLUMNS: { status: Status; label: string }[] = [
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'en_route', label: 'En route' },
  { status: 'on_scene', label: 'On scene' },
  { status: 'complete', label: 'Complete' },
];

// Allowed forward transitions surfaced as big tap targets on each job card.
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

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ISO -> value for <input type="datetime-local"> in the viewer's local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
      if (err instanceof ApiError && err.status === 401) { onLogout(); return; }
      onError(err instanceof Error ? err.message : 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [onError, onLogout]);

  useEffect(() => { void reload(); }, [reload]);

  async function transition(id: string, status: Status) {
    try { await api.updateJob(id, { status }); await reload(); }
    catch (err) { onError(err instanceof Error ? err.message : 'update failed'); }
  }

  async function saveDetails(id: string, patch: { scheduled_at?: string | null; notes?: string | null }) {
    try { await api.updateJob(id, patch); await reload(); }
    catch (err) { onError(err instanceof Error ? err.message : 'save failed'); }
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
                    <JobCard
                      key={job.id}
                      job={job}
                      vessel={job.vessel_id ? vesselName.get(job.vessel_id) ?? 'Unknown vessel' : 'Unassigned vessel'}
                      client={job.client_id ? clientName.get(job.client_id) ?? 'Unknown client' : 'No client'}
                      onTransition={(s) => transition(job.id, s)}
                      onSave={(p) => saveDetails(job.id, p)}
                    />
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

function JobCard({
  job, vessel, client, onTransition, onSave,
}: {
  job: Job;
  vessel: string;
  client: string;
  onTransition: (s: Status) => void;
  onSave: (p: { scheduled_at?: string | null; notes?: string | null }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(() => toLocalInput(job.scheduled_at));
  const [notes, setNotes] = useState(job.notes ?? '');
  const [busy, setBusy] = useState(false);
  const scheduled = formatWhen(job.scheduled_at);

  async function save() {
    setBusy(true);
    await onSave({
      scheduled_at: when ? new Date(when).toISOString() : null,
      notes: notes.trim() ? notes.trim() : null,
    });
    setBusy(false);
    setEditing(false);
  }

  return (
    <article className="rounded-md bg-slate-900 p-3 ring-1 ring-slate-700">
      <p className="font-medium text-white">{vessel}</p>
      <p className="text-xs text-slate-400">{client}</p>
      {scheduled && <p className="mt-1 text-xs font-medium text-sky-300">⏱ {scheduled}</p>}
      {job.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{job.notes}</p>}

      <div className="mt-2 flex flex-wrap gap-1">
        {NEXT[job.status].map((next) => (
          <button
            key={next}
            onClick={() => onTransition(next)}
            className="rounded bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
          >
            → {STATUS_LABEL[next]}
          </button>
        ))}
        <button
          onClick={() => setEditing((e) => !e)}
          className="rounded bg-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600"
        >
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>

      {editing && (
        <div className="mt-2 space-y-2 rounded bg-slate-800 p-2 ring-1 ring-slate-700">
          <label className="block text-xs">
            <span className="text-slate-400">Scheduled time</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-1 block w-full rounded bg-slate-900 px-2 py-1.5 text-sm text-slate-100 ring-1 ring-slate-700"
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-400">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Instructions for the crew…"
              className="mt-1 block w-full rounded bg-slate-900 px-2 py-1.5 text-sm text-slate-100 ring-1 ring-slate-700"
            />
          </label>
          <button
            onClick={() => void save()}
            disabled={busy}
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </article>
  );
}

function NewJobForm({
  vessels, clients, onCreated, onError,
}: {
  vessels: Vessel[];
  clients: Client[];
  onCreated: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [vesselId, setVesselId] = useState('');
  const [clientId, setClientId] = useState('');
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError('');
    try {
      await api.createJob({
        vessel_id: vesselId || undefined,
        client_id: clientId || undefined,
        scheduled_at: when ? new Date(when).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      setVesselId(''); setClientId(''); setWhen(''); setNotes('');
      await onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'could not create job');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg bg-slate-800/60 p-4 ring-1 ring-slate-700">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="text-slate-300">Vessel</span>
          <select value={vesselId} onChange={(e) => setVesselId(e.target.value)} className="mt-1 block rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700">
            <option value="">— select —</option>
            {vessels.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-300">Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 block rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700">
            <option value="">— none —</option>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-300">Scheduled time</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1 block rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700" />
        </label>
        <button type="submit" disabled={busy} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {busy ? 'Adding…' : 'New job'}
        </button>
      </div>
      <label className="mt-3 block text-sm">
        <span className="text-slate-300">Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Job instructions, berth, contact…" className="mt-1 block w-full rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700" />
      </label>
    </form>
  );
}
