import { useState, type FormEvent, type ReactNode } from 'react';
import { usePresenter } from '../hooks/usePresenter';
import { Btn } from './ui';

/** Pide la clave de expositor la primera vez en este dispositivo. */
export function PresenterGate({ children }: { children: ReactNode }) {
  const { status, validate } = usePresenter();
  const [who, setWho] = useState('Juan José');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (status === 'checking') return <div className="grid min-h-dvh place-items-center text-xl font-bold text-navy">Verificando…</div>;
  if (status === 'yes') return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const ok = await validate(key.trim(), who).catch(() => false);
    setBusy(false);
    if (!ok) setError(true);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5">
      <h1 className="text-3xl font-extrabold text-navy">🎛️ Panel del expositor</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {['Juan José', 'Cristian', 'Renzo'].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setWho(n)}
              className={`rounded-xl px-3 py-2 font-bold ${who === n ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-slate-200'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <input
          type="password"
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Clave de expositor"
          className="rounded-2xl bg-white px-4 py-3 text-xl font-bold text-navy ring-2 ring-slate-200 outline-none focus:ring-naranja"
        />
        {error && <div className="font-bold text-rojo">Clave incorrecta</div>}
        <Btn big disabled={busy || !key.trim()}>
          {busy ? 'Verificando…' : 'Entrar'}
        </Btn>
      </form>
    </main>
  );
}
