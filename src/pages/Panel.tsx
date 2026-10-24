import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_BLOCK_IDS, BLOCKS, getSlide, nextPos, prevPos } from '../content/blocks';
import { computeRanking, getQuiz, quizzesOfBlock, type Quiz } from '../content/quizzes';
import { PresenterGate } from '../components/PresenterGate';
import { ResultBars } from '../components/quiz';
import { SlidePreview } from '../components/SlideView';
import { Timer } from '../components/Timer';
import { Btn, Card } from '../components/ui';
import { firebaseConfigured } from '../firebase';
import { useCounts, useAllAnswers } from '../hooks/useQuiz';
import { useParticipants } from '../hooks/usePresence';
import { useSession } from '../hooks/useSession';
import { clearSessionData } from '../lib/admin';
import { setLocalMode } from '../lib/sessionStore';
import { DEFAULT_SESSION, type Answer, type Speaker } from '../lib/types';

export default function Panel() {
  return (
    <PresenterGate>
      <Dashboard />
    </PresenterGate>
  );
}

const SPEAKERS: Speaker[] = ['Juan José', 'Cristian', 'Renzo', 'Los tres'];

function Dashboard() {
  const { session: S, meta, loading, update } = useSession();
  const answers = useAllAnswers(!meta.local);
  const { online } = useParticipants(!meta.local);
  const [error, setError] = useState<string | null>(null);
  const created = useRef(false);

  const run = useCallback(
    (p: Promise<unknown>) =>
      p.then(
        () => setError(null),
        (e: Error) => setError(e.message.includes('permission') ? 'Sin permiso: ¿publicaste las reglas?' : e.message),
      ),
    [],
  );

  // Crea la sesión la primera vez.
  useEffect(() => {
    if (!loading && !meta.exists && !meta.local && !meta.error && !created.current) {
      created.current = true;
      run(update({ ...DEFAULT_SESSION, startedAt: null }));
    }
  }, [loading, meta, update, run]);

  const goTo = useCallback(
    (p: { block: number; slide: number } | null) => {
      if (!p) return;
      const unlocked = S.unlockedBlocks.includes(p.block) ? S.unlockedBlocks : [...S.unlockedBlocks, p.block].sort();
      run(
        update({
          currentBlock: p.block,
          currentSlide: p.slide,
          unlockedBlocks: unlocked,
          currentSpeaker: p.block !== S.currentBlock ? BLOCKS[p.block].speaker : S.currentSpeaker,
          status: S.status === 'lobby' ? 'live' : S.status,
          // Al cambiar de pantalla se quita la pregunta ya cerrada o con resultados (una abierta se respeta).
          ...(S.activeQuizId && S.quizState !== 'open' ? { activeQuizId: null, quizState: 'idle' as const } : {}),
        }),
      );
    },
    [S, update, run],
  );

  const start = () =>
    run(
      update({
        status: 'live',
        unlockedBlocks: [0],
        currentBlock: 0,
        currentSlide: 0,
        currentSpeaker: 'Juan José',
        activeQuizId: null,
        quizState: 'idle',
        showRanking: false,
        ranking: [],
        doneQuizzes: [],
        startedAt: 'now',
      }),
    );

  const finish = () => run(update({ status: 'ended', unlockedBlocks: ALL_BLOCK_IDS, activeQuizId: null, quizState: 'idle' }));

  const reset = () => {
    if (!window.confirm('¿Reiniciar todo? Se borran respuestas y conectados y se vuelve al lobby.')) return;
    run(update({ ...DEFAULT_SESSION, startedAt: null }).then(() => clearSessionData()));
  };

  const unlockNext = useCallback(() => {
    const next = ALL_BLOCK_IDS.find((b) => !S.unlockedBlocks.includes(b));
    if (next !== undefined) run(update({ unlockedBlocks: [...S.unlockedBlocks, next].sort() }));
  }, [S.unlockedBlocks, update, run]);

  // ── Preguntas ──
  const slide = getSlide(S.currentBlock, S.currentSlide);
  const blockQuizzes = useMemo(() => {
    const list = quizzesOfBlock(S.currentBlock);
    if (slide?.quizId && !list.some((q) => q.id === slide.quizId)) list.unshift(getQuiz(slide.quizId)!);
    return list;
  }, [S.currentBlock, slide?.quizId]);

  const answeredIds = useMemo(() => new Set(answers.map((a) => a.quizId)), [answers]);
  const suggested: Quiz | undefined =
    getQuiz(slide?.quizId) ?? blockQuizzes.find((q) => !answeredIds.has(q.id)) ?? blockQuizzes[0];

  const launch = useCallback((id: string) => run(update({ activeQuizId: id, quizState: 'open' })), [update, run]);
  /** Muestra resultados de una pregunta y la marca como hecha (queda para repasar en su Mini-quiz). */
  const showResults = useCallback(
    (id: string) =>
      run(
        update({
          activeQuizId: id,
          quizState: 'results',
          doneQuizzes: S.doneQuizzes.includes(id) ? S.doneQuizzes : [...S.doneQuizzes, id],
        }),
      ),
    [S.doneQuizzes, update, run],
  );
  const setQuizState = useCallback(
    (quizState: 'closed' | 'results') =>
      quizState === 'results' && S.activeQuizId ? showResults(S.activeQuizId) : run(update({ quizState })),
    [S.activeQuizId, showResults, update, run],
  );
  const hideQuiz = () => run(update({ activeQuizId: null, quizState: 'idle' }));

  const ranking = useMemo(() => computeRanking(answers), [answers]);
  const top5 = useMemo(() => ranking.slice(0, 5).map(({ name, points }) => ({ name, points })), [ranking]);
  const toggleRanking = () => run(update({ showRanking: !S.showRanking, ranking: top5 }));

  // Mientras el Top 5 está visible, se mantiene al día solo (si llega una respuesta tarde, se actualiza).
  useEffect(() => {
    if (S.showRanking && !meta.local && JSON.stringify(top5) !== JSON.stringify(S.ranking)) run(update({ ranking: top5 }));
  }, [S.showRanking, S.ranking, top5, meta.local, update, run]);

  // ── Atajos de teclado ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight') goTo(nextPos(S.currentBlock, S.currentSlide));
      else if (e.key === 'ArrowLeft') goTo(prevPos(S.currentBlock, S.currentSlide));
      else if (e.key.toLowerCase() === 'u') unlockNext();
      else if (e.key.toLowerCase() === 'q') {
        if (S.activeQuizId && S.quizState === 'open') setQuizState('closed');
        else if (S.activeQuizId && S.quizState === 'closed') setQuizState('results');
        else if (suggested) launch(suggested.id);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [S, goTo, unlockNext, setQuizState, launch, suggested]);

  const next = nextPos(S.currentBlock, S.currentSlide);
  const activeQuiz = getQuiz(S.activeQuizId);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 bg-navy px-4 py-2 text-white">
        <span className="text-lg font-extrabold">🎛️ Panel</span>
        <StatusPill status={S.status} />
        <Timer startedAt={S.startedAt} block={S.currentBlock} compact />
        <span className="flex-1" />
        <Link to="/presentacion" target="_blank" className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold">
          📽️ Abrir presentación
        </Link>
        {firebaseConfigured && (
          <button
            onClick={() => setLocalMode(!meta.local)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold ${meta.local ? 'bg-naranja' : 'bg-white/10'}`}
            title="Plan B sin internet: el panel y la presentación (en este mismo navegador) funcionan sin Firestore"
          >
            {meta.local ? '📴 Modo local ON' : '📶 En línea'}
          </button>
        )}
      </header>

      {meta.local && (
        <div className="bg-naranja/10 px-4 py-2 text-sm font-bold text-naranja">
          Modo local (plan B): los cambios solo se ven en este navegador (panel + presentación). Los celulares no se actualizan.
        </div>
      )}
      {(error || meta.error) && <div className="bg-rojo/10 px-4 py-2 text-sm font-bold text-rojo">⚠️ {error ?? meta.error}</div>}

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* Control general */}
          <Card className="flex flex-wrap gap-2">
            <Btn big variant="success" onClick={start} disabled={S.status === 'live'}>
              ▶ Iniciar
            </Btn>
            <Btn big variant="primary" onClick={finish} disabled={S.status !== 'live'}>
              🏁 Finalizar
            </Btn>
            <Btn big variant="danger" onClick={reset}>
              ↺ Reiniciar
            </Btn>
          </Card>

          {/* Navegación */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Btn big variant="secondary" onClick={() => goTo(prevPos(S.currentBlock, S.currentSlide))}>
                ← Anterior
              </Btn>
              <div className="flex-1 text-center">
                <div className="text-xs font-bold text-slate-500">Pantalla actual</div>
                <div className="text-lg font-extrabold text-navy">
                  {slide?.id} · {slide?.title}
                </div>
              </div>
              <Btn big onClick={() => goTo(next)} disabled={!next}>
                Siguiente →
              </Btn>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SlidePreview block={S.currentBlock} slide={S.currentSlide} session={S} label="AHORA" />
              {next ? (
                <SlidePreview block={next.block} slide={next.slide} session={S} label="SIGUIENTE" />
              ) : (
                <div className="grid place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">Fin</div>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Atajos: ← → pantallas · U desbloquear siguiente bloque · Q lanzar / cerrar / resultados
            </p>
          </Card>

          {/* Bloques */}
          <Card className="space-y-2">
            <h2 className="font-extrabold text-navy">Bloques</h2>
            {BLOCKS.map((b) => {
              const unlocked = S.unlockedBlocks.includes(b.id);
              const current = b.id === S.currentBlock;
              return (
                <div
                  key={b.id}
                  className={`flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 ring-1 ${
                    current ? 'bg-naranja/10 ring-naranja' : 'bg-white ring-slate-200'
                  }`}
                >
                  <span className="text-2xl">{unlocked ? b.icon : '🔒'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-navy">
                      {b.id}. {b.title}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      🎤 {b.speaker} · {b.slides.length} pantallas
                    </div>
                  </div>
                  {!unlocked && (
                    <Btn variant="accent" onClick={() => run(update({ unlockedBlocks: [...S.unlockedBlocks, b.id].sort() }))}>
                      Desbloquear
                    </Btn>
                  )}
                  <Btn variant="secondary" onClick={() => goTo({ block: b.id, slide: 0 })}>
                    Ir
                  </Btn>
                  {current && (
                    <div className="flex w-full flex-wrap gap-1">
                      {b.slides.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => goTo({ block: b.id, slide: i })}
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${
                            i === S.currentSlide ? 'bg-navy text-white' : 'bg-fondo text-navy'
                          }`}
                        >
                          {s.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          {/* Quién habla */}
          <Card className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-navy">🎤 Quién habla:</span>
            {SPEAKERS.map((sp) => (
              <button
                key={sp}
                onClick={() => run(update({ currentSpeaker: sp }))}
                className={`rounded-xl px-3 py-2 font-bold ${
                  S.currentSpeaker === sp ? 'bg-navy text-white' : 'bg-fondo text-navy'
                }`}
              >
                {sp}
              </button>
            ))}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="mb-2 font-extrabold text-navy">⏱️ Cronómetro</h2>
            <Timer startedAt={S.startedAt} block={S.currentBlock} />
          </Card>

          {/* Preguntas */}
          <Card className="space-y-3">
            <h2 className="font-extrabold text-navy">❓ Preguntas del bloque</h2>
            {blockQuizzes.length === 0 && <p className="text-sm text-slate-500">Este bloque no tiene preguntas.</p>}
            {blockQuizzes.map((q) => (
              <QuizControl
                key={q.id}
                quiz={q}
                active={S.activeQuizId === q.id}
                state={S.quizState}
                answers={answers}
                onlineCount={online.length}
                onLaunch={() => launch(q.id)}
                onClose={() => setQuizState('closed')}
                onResults={() => showResults(q.id)}
                onHide={hideQuiz}
              />
            ))}
            {activeQuiz && !blockQuizzes.some((q) => q.id === activeQuiz.id) && (
              <div className="rounded-xl bg-naranja/10 p-2 text-sm font-bold text-naranja">
                Activa: “{activeQuiz.question}” ·{' '}
                <button className="underline" onClick={hideQuiz}>
                  ocultar
                </button>
              </div>
            )}
          </Card>

          {/* Top 5 */}
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-navy">🏆 Top 5</h2>
              <Btn variant={S.showRanking ? 'accent' : 'secondary'} onClick={toggleRanking}>
                {S.showRanking ? 'Ocultar' : 'Mostrar a todos'}
              </Btn>
            </div>
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.uid} className="flex justify-between text-sm font-bold text-navy">
                <span>
                  {i + 1}. {r.name}
                </span>
                <span>{r.points} pts</span>
              </div>
            ))}
            {ranking.length === 0 && <p className="text-sm text-slate-500">Aún no hay respuestas: el Top 5 se llena con las preguntas.</p>}
            {S.showRanking && <p className="text-xs text-slate-500">Visible para todos · se actualiza solo.</p>}
          </Card>

          {/* Conectados */}
          <Card>
            <h2 className="font-extrabold text-navy">👥 Conectados: {online.length}</h2>
            <div className="mt-2 flex max-h-48 flex-wrap gap-1 overflow-auto">
              {online.map((p) => (
                <span key={p.uid} className="rounded-lg bg-fondo px-2 py-1 text-xs font-bold text-navy">
                  {p.name}
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    lobby: 'bg-white/20 ⏳ Lobby',
    live: 'bg-red-500 🔴 En vivo',
    ended: 'bg-verde 🏁 Terminada',
  };
  const [bg, ...label] = (map[status] ?? map.lobby).split(' ');
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${bg}`}>{label.join(' ')}</span>;
}

function QuizControl({
  quiz,
  active,
  state,
  answers,
  onlineCount,
  onLaunch,
  onClose,
  onResults,
  onHide,
}: {
  quiz: Quiz;
  active: boolean;
  state: string;
  answers: Answer[];
  onlineCount: number;
  onLaunch: () => void;
  onClose: () => void;
  onResults: () => void;
  onHide: () => void;
}) {
  const counts = useCounts(answers, quiz.id);
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div className={`space-y-2 rounded-2xl p-3 ring-1 ${active ? 'bg-naranja/5 ring-naranja' : 'ring-slate-200'}`}>
      <div className="text-sm font-extrabold text-navy">{quiz.question}</div>
      <div className="flex flex-wrap gap-1">
        <Btn variant="accent" onClick={onLaunch} disabled={active && state === 'open'}>
          Lanzar
        </Btn>
        <Btn variant="secondary" onClick={onClose} disabled={!active || state !== 'open'}>
          Cerrar
        </Btn>
        <Btn variant="success" onClick={onResults} disabled={active && state === 'results'}>
          Resultados
        </Btn>
        {active && (
          <Btn variant="ghost" onClick={onHide}>
            Quitar
          </Btn>
        )}
      </div>
      {(active || total > 0) && (
        <>
          <div className="text-xs font-bold text-slate-500">
            {total} de {Math.max(onlineCount, total)} respondieron
            {active && ` · ${state === 'open' ? 'abierta' : state === 'closed' ? 'cerrada' : 'mostrando resultados'}`}
          </div>
          <ResultBars quiz={quiz} counts={counts} />
        </>
      )}
    </div>
  );
}
