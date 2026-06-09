import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, ROLES, type Role } from '../api.ts';

interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface ResourceConfig<T> {
  title: string;
  load: () => Promise<T[]>;
  rowMain: (t: T) => string;
  rowSub: (t: T) => string;
  fields: FieldDef[];
  create: (values: Record<string, string>) => Promise<void>;
  addLabel: string;
}

function emptyValues(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.name, f.options ? (f.options[0]?.value ?? '') : '']));
}

function ResourceManager<T>({ config, onError }: { config: ResourceConfig<T>; onError: (m: string) => void }) {
  const [items, setItems] = useState<T[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(config.fields));
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setItems(await config.load());
    } catch (err) {
      onError(err instanceof Error ? err.message : 'failed to load');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError('');
    try {
      await config.create(values);
      setValues(emptyValues(config.fields));
      await reload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'could not create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-slate-700">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{config.title}</h2>
      <div className="mb-4 space-y-1">
        {items.length === 0 && <p className="text-xs text-slate-500">None yet</p>}
        {items.map((it, i) => (
          <div key={i} className="flex items-baseline justify-between rounded bg-slate-900 px-3 py-1.5 ring-1 ring-slate-700">
            <span className="text-sm text-white">{config.rowMain(it)}</span>
            <span className="text-xs text-slate-400">{config.rowSub(it)}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        {config.fields.map((f) => (
          <label key={f.name} className="text-xs">
            <span className="text-slate-400">{f.label}</span>
            {f.options ? (
              <select
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="mt-1 block rounded-md bg-slate-900 px-2 py-1.5 text-sm text-slate-100 ring-1 ring-slate-700"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type ?? 'text'}
                required={f.required}
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="mt-1 block rounded-md bg-slate-900 px-2 py-1.5 text-sm text-slate-100 ring-1 ring-slate-700"
              />
            )}
          </label>
        ))}
        <button type="submit" disabled={busy} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {busy ? 'Adding…' : config.addLabel}
        </button>
      </form>
    </section>
  );
}

export function Fleet({ role, onError }: { role: string; onError: (m: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ResourceManager
        onError={onError}
        config={{
          title: 'Vessels',
          addLabel: 'Add vessel',
          load: async () => (await api.listVessels()).vessels,
          rowMain: (v) => v.name,
          rowSub: (v) => `${v.official_number ?? '—'} · ${v.status}`,
          fields: [
            { name: 'name', label: 'Name', required: true },
            { name: 'official_number', label: 'Official #' },
          ],
          create: (vals) => api.createVessel({ name: vals.name ?? '', official_number: vals.official_number || undefined }).then(() => undefined),
        }}
      />
      <ResourceManager
        onError={onError}
        config={{
          title: 'Clients',
          addLabel: 'Add client',
          load: async () => (await api.listClients()).clients,
          rowMain: (c) => c.name,
          rowSub: (c) => c.billing_email ?? '—',
          fields: [
            { name: 'name', label: 'Name', required: true },
            { name: 'billing_email', label: 'Billing email', type: 'email' },
          ],
          create: (vals) => api.createClient({ name: vals.name ?? '', billing_email: vals.billing_email || undefined }).then(() => undefined),
        }}
      />
      <ResourceManager
        onError={onError}
        config={{
          title: 'Crew',
          addLabel: 'Add crew',
          load: async () => (await api.listCrew()).crew,
          rowMain: (c) => c.full_name,
          rowSub: (c) => c.rank ?? '—',
          fields: [
            { name: 'full_name', label: 'Full name', required: true },
            { name: 'rank', label: 'Rank' },
          ],
          create: (vals) => api.createCrew({ full_name: vals.full_name ?? '', rank: vals.rank || undefined }).then(() => undefined),
        }}
      />
      {role === 'fleet_admin' && (
        <ResourceManager
          onError={onError}
          config={{
            title: 'Users',
            addLabel: 'Add user',
            load: async () => (await api.listUsers()).users,
            rowMain: (u) => u.email,
            rowSub: (u) => u.role,
            fields: [
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'full_name', label: 'Full name' },
              { name: 'role', label: 'Role', options: ROLES.map((r) => ({ value: r, label: r })) },
              { name: 'password', label: 'Password', type: 'password', required: true },
            ],
            create: (vals) =>
              api
                .createUser({
                  email: vals.email ?? '',
                  full_name: vals.full_name || undefined,
                  role: (vals.role ?? 'crew') as Role,
                  password: vals.password ?? '',
                })
                .then(() => undefined),
          }}
        />
      )}
    </div>
  );
}
