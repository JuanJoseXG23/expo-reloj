import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { firebaseConfigured } from '../firebase';
import { cleanName, isValidName, useIdentity } from '../hooks/useIdentity';
import { tryPresenterKey } from '../hooks/usePresenter';
import { TimingDiagram } from '../components/timing/TimingDiagram';
import { useAnimTime } from '../hooks/useAnimTime';

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => window.setTimeout(() => r(fallback), ms))]);
}

export default function Enter() {
  const { name: saved, setName } = useIdentity();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [t] = useAnimTime(true, 0.8);

  if (saved) return <Navigate to="/sala" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = cleanName(value);
    if (!isValidName(n)) {
      setError('Escribe entre 2 y 40 letras.');
      return;
    }
    setBusy(true);
    setError(null);
    // Si escribió la clave de expositor (sin espacios), las reglas de Firestore lo convierten en expositor.
    if (firebaseConfigured && !/\s/.test(n)) {
      const isPresenter = await withTimeout(
        tryPresenterKey(n, 'Expositor').catch(() => false),
        5000,
        false,
      );
      if (isPresenter) {
        navigate('/panel');
        return;
      }
    }
    setName(n);
    navigate('/sala');
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="text-center">
        <div className="text-sm font-bold text-azul">Sistemas Digitales y Ensambladores</div>
        <h1 className="mt-1 text-4xl font-extrabold leading-tight text-navy">
          Señales de reloj <span className="text-naranja">⏱️</span>
        </h1>
      </div>
      <div className="rounded-3xl bg-white p-2 ring-1 ring-slate-200">
        <TimingDiagram from={t} to={t + 5} hideLabels rowHeight={48} width={400} signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]} />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="nombre" className="text-lg font-bold text-navy">
          Tu nombre
        </label>
        <input
          id="nombre"
          autoFocus
          autoComplete="given-name"
          maxLength={40}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej: Laura"
          className="rounded-2xl border-0 bg-white px-5 py-4 text-2xl font-bold text-navy shadow-sm ring-2 ring-slate-200 outline-none focus:ring-naranja"
        />
        {error && <div className="font-bold text-rojo">{error}</div>}
        <button
          disabled={busy || cleanName(value).length < 2}
          className="rounded-2xl bg-naranja py-4 text-2xl font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-40"
        >
          {busy ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>
      <p className="text-center text-sm font-semibold text-slate-500">Juan José · Cristian · Renzo</p>
    </main>
  );
}
