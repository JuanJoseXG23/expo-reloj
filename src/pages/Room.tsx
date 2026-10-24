import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BLOCKS, nextPos, prevPos, visibleBlocks } from '../content/blocks';
import { BlockDots } from '../components/BlockDots';
import { QuizCard } from '../components/QuizCard';
import { SlideView } from '../components/SlideView';
import { Btn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useIdentity } from '../hooks/useIdentity';
import { useParticipants, usePresence } from '../hooks/usePresence';
import { useSession } from '../hooks/useSession';

interface Pos {
  block: number;
  slide: number;
}

export default function Room() {
  const { name, clear } = useIdentity();
  const { user, error: authError } = useAuth();
  const { session, loading, meta } = useSession();
  const navigate = useNavigate();
  const uid = user?.uid ?? null;
  usePresence(uid, name);
  const inLobby = session.status === 'lobby';
  const { online } = useParticipants(inLobby);

  const [exploring, setExploring] = useState(false);
  const [local, setLocal] = useState<Pos>({ block: 0, slide: 0 });

  const ended = session.status === 'ended';
  const visible = visibleBlocks(session.status, session.unlockedBlocks);
  const isExploring = exploring || ended;
  const live: Pos = { block: session.currentBlock, slide: session.currentSlide };
  const pos = isExploring ? local : live;

  // Al terminar, se muestra "¡Gracias!" y desde ahí se puede repasar todo.
  useEffect(() => {
    if (ended) setLocal({ block: BLOCKS.length - 1, slide: BLOCKS[BLOCKS.length - 1].slides.length - 1 });
  }, [ended]);

  // Nunca mostrar un bloque bloqueado (si el expositor reinicia, por ejemplo).
  useEffect(() => {
    if (isExploring && !visible.includes(local.block)) {
      setExploring(false);
    }
  }, [isExploring, visible, local.block]);

  if (!name) return <Navigate to="/" replace />;

  const notMe = () => {
    clear();
    navigate('/');
  };

  if (loading) return <Center>Conectando…</Center>;

  if (inLobby) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <div className="text-6xl animate-bounce">⏱️</div>
        <h1 className="text-3xl font-extrabold text-navy">Señales de reloj y diagramas de tiempo</h1>
        <p className="text-xl font-bold text-azul">Hola, {name} 👋</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Juan José', 'Cristian', 'Renzo'].map((n) => (
            <span key={n} className="rounded-2xl bg-white px-4 py-2 font-bold text-navy ring-1 ring-slate-200">
              {n}
            </span>
          ))}
        </div>
        <div className="rounded-3xl bg-navy px-6 py-4 text-white">
          <div className="text-4xl font-extrabold">{Math.max(online.length, 1)}</div>
          <div className="font-semibold">compañeros conectados</div>
        </div>
        <p className="font-semibold text-slate-500">Espera… la exposición empieza pronto.</p>
        {(authError || meta.error) && <p className="text-sm font-bold text-rojo">Sin conexión. Revisa tu internet.</p>}
        <button onClick={notMe} className="text-sm font-bold text-slate-400 underline">
          No soy {name} / cambiar nombre
        </button>
      </main>
    );
  }

  const block = BLOCKS[pos.block];
  const go = (p: Pos | null) => {
    if (p && visible.includes(p.block)) setLocal(p);
  };
  const startExplore = (b?: number) => {
    setLocal(b === undefined ? live : { block: b, slide: 0 });
    setExploring(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra superior mínima */}
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-navy px-3 py-2 text-white shadow">
        <span className="text-xl">{block?.icon}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-extrabold">{block?.title}</div>
          <div className="truncate text-xs font-semibold opacity-80">🎤 {session.currentSpeaker}</div>
        </div>
        {ended ? (
          <span className="rounded-full bg-verde px-3 py-1 text-xs font-extrabold">📚 REPASO</span>
        ) : isExploring ? (
          <button onClick={() => setExploring(false)} className="rounded-full bg-naranja px-3 py-1.5 text-xs font-extrabold">
            ↩ Volver al vivo
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-red-500" /> EN VIVO
          </span>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <QuizCard session={session} uid={uid} name={name} />
        <SlideView block={pos.block} slide={pos.slide} session={session} mode="student" />
      </main>

      {/* Navegación inferior */}
      <footer className="sticky bottom-0 z-20 space-y-2 border-t border-slate-200 bg-fondo/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur">
        {isExploring ? (
          <div className="flex items-center justify-between gap-2">
            <Btn variant="secondary" onClick={() => go(prevPos(pos.block, pos.slide))} disabled={!canGo(prevPos(pos.block, pos.slide), visible)}>
              ←
            </Btn>
            <span className="text-sm font-bold text-navy">
              {block?.slides[pos.slide]?.id} · {pos.slide + 1}/{block?.slides.length}
            </span>
            <Btn variant="secondary" onClick={() => go(nextPos(pos.block, pos.slide))} disabled={!canGo(nextPos(pos.block, pos.slide), visible)}>
              →
            </Btn>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={() => startExplore()} className="text-sm font-bold text-azul">
              🧭 Explorar lo desbloqueado
            </button>
          </div>
        )}
        <BlockDots visible={visible} current={pos.block} onPick={(b) => startExplore(b)} />
      </footer>
    </div>
  );
}

function canGo(p: Pos | null, visible: number[]) {
  return p !== null && visible.includes(p.block);
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh place-items-center text-xl font-bold text-navy">{children}</div>;
}
