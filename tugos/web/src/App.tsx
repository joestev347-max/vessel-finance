import { useEffect, useState } from 'react';
import { api } from './api.ts';
import { Login } from './components/Login.tsx';
import { Dispatch } from './components/Dispatch.tsx';
import { Fleet } from './components/Fleet.tsx';

type View = 'dispatch' | 'fleet';
type Status = 'checking' | 'authed' | 'guest';

export function App() {
  const [status, setStatus] = useState<Status>('checking');
  const [role, setRole] = useState<string>('');
  const [view, setView] = useState<View>('dispatch');
  const [error, setError] = useState('');

  // On load, ask the server whether the session cookie is valid.
  useEffect(() => {
    let active = true;
    api.me()
      .then((r) => { if (active) { setRole(r.role); setStatus('authed'); } })
      .catch(() => { if (active) setStatus('guest'); });
    return () => { active = false; };
  }, []);

  function onLoggedIn(r: string) {
    setRole(r);
    setStatus('authed');
  }
  function onLogout() {
    void api.logout().catch(() => {});
    setStatus('guest');
    setRole('');
    setView('dispatch');
  }

  if (status === 'checking') {
    return <div className="flex min-h-full items-center justify-center bg-slate-900 text-slate-400">Loading…</div>;
  }
  if (status === 'guest') {
    return (
      <div className="min-h-full bg-slate-900 text-slate-100">
        <Login onLoggedIn={onLoggedIn} />
      </div>
    );
  }

  const tab = (v: View, label: string) => (
    <button
      onClick={() => { setView(v); setError(''); }}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-full bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">TugOS</h1>
            <nav className="flex gap-2">
              {tab('dispatch', 'Dispatch')}
              {tab('fleet', 'Fleet')}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{role}</span>
            <button onClick={onLogout} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
              Sign out
            </button>
          </div>
        </header>

        {error && <p className="mb-4 rounded-md bg-red-900/50 px-3 py-2 text-sm text-red-200 ring-1 ring-red-700">{error}</p>}

        {view === 'dispatch' ? (
          <Dispatch onError={setError} onLogout={onLogout} />
        ) : (
          <Fleet role={role} onError={setError} />
        )}
      </div>
    </div>
  );
}
