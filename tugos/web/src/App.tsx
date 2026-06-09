import { useState } from 'react';
import { clearToken, getToken } from './api.ts';
import { Login } from './components/Login.tsx';
import { Dispatch } from './components/Dispatch.tsx';

export function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [role, setRole] = useState<string>('');

  function onLoggedIn(r: string) {
    setRole(r);
    setTokenState(getToken());
  }
  function onLogout() {
    clearToken();
    setTokenState(null);
    setRole('');
  }

  return (
    <div className="min-h-full bg-slate-900 text-slate-100">
      {token ? <Dispatch role={role} onLogout={onLogout} /> : <Login onLoggedIn={onLoggedIn} />}
    </div>
  );
}
