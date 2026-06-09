import { useState, type FormEvent } from 'react';
import { api, ApiError, setToken } from '../api.ts';

export function Login({ onLoggedIn }: { onLoggedIn: (role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token, role } = await api.login(email, password);
      setToken(token);
      onLoggedIn(role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-8 shadow-xl ring-1 ring-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-white">TugOS</h1>
          <p className="text-sm text-slate-400">Dispatch — sign in</p>
        </div>
        <label className="block text-sm">
          <span className="text-slate-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border-0 bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500"
            placeholder="captain@demo.test"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md border-0 bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-sky-500"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-sky-600 px-3 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
