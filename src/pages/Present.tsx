import { useEffect } from 'react';
import { BLOCKS } from '../content/blocks';
import { getQuiz } from '../content/quizzes';
import { PresenterGate } from '../components/PresenterGate';
import { JoinQr } from '../components/Qr';
import { QuizOptions, ResultBars } from '../components/quiz';
import { SlideView } from '../components/SlideView';
import { Confetti } from '../components/ui/Confetti';
import { useCounts, useQuizAnswers } from '../hooks/useQuiz';
import { useParticipants } from '../hooks/usePresence';
import { useSession } from '../hooks/useSession';

export default function Present() {
  return (
    <PresenterGate>
      <Screen />
    </PresenterGate>
  );
}

/** Pantalla completa para el video beam: letra grande. */
function Screen() {
  const { session: S, meta } = useSession();
  const { online } = useParticipants(!meta.local);
  const quiz = getQuiz(S.activeQuizId);
  const answers = useQuizAnswers(quiz?.id ?? null, !meta.local);
  const counts = useCounts(answers, quiz?.id ?? null);
  const total = counts.reduce((a, b) => a + b, 0);

  // Agranda todo el texto (las pantallas usan rem).
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.fontSize;
    html.style.fontSize = 'clamp(16px, 1.25vw, 30px)';
    return () => {
      html.style.fontSize = prev;
    };
  }, []);

  const goFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => undefined);

  if (S.status === 'lobby') {
    return (
      <main className="grid min-h-dvh items-center gap-10 p-10 lg:grid-cols-2" onDoubleClick={goFullscreen}>
        <div className="space-y-6">
          <div className="text-lg font-bold text-azul">Sistemas Digitales y Ensambladores</div>
          <h1 className="text-6xl font-extrabold leading-tight text-navy">
            Señales de reloj <span className="text-naranja">y</span> diagramas de tiempo
          </h1>
          <div className="text-2xl font-bold text-navy">Juan José · Cristian · Renzo</div>
          <div className="inline-block rounded-3xl bg-navy px-8 py-5 text-white">
            <div className="text-6xl font-extrabold">{online.length}</div>
            <div className="text-xl font-semibold">compañeros conectados</div>
          </div>
          <div className="text-2xl font-bold text-slate-600">📱 Escanea, escribe tu nombre y entra.</div>
        </div>
        <div className="flex justify-center">
          <JoinQr size={Math.min(560, Math.round(window.innerHeight * 0.6))} />
        </div>
      </main>
    );
  }

  const block = BLOCKS[S.currentBlock];
  const showQuiz = quiz && S.quizState !== 'idle';

  return (
    <div className="flex min-h-dvh flex-col" onDoubleClick={goFullscreen}>
      <header className="flex items-center gap-4 bg-navy px-8 py-3 text-white">
        <span className="text-3xl">{block?.icon}</span>
        <div className="flex-1">
          <div className="text-2xl font-extrabold">{block?.title}</div>
          <div className="text-base font-semibold opacity-80">🎤 {S.currentSpeaker}</div>
        </div>
        {S.status === 'ended' ? (
          <span className="rounded-full bg-verde px-4 py-1 font-extrabold">📚 Repaso</span>
        ) : (
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 font-extrabold">
            <span className="live-dot h-3 w-3 rounded-full bg-red-500" /> EN VIVO · 👥 {online.length}
          </span>
        )}
      </header>

      <main className="relative flex-1 px-8 py-6">
        <div className="mx-auto max-w-5xl">
          {S.status === 'ended' ? (
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <SlideView block={4} slide={3} session={S} mode="present" />
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold text-navy">Repasa todo aquí 👇</div>
                <JoinQr size={360} />
              </div>
            </div>
          ) : (
            <SlideView block={S.currentBlock} slide={S.currentSlide} session={S} mode="present" />
          )}
        </div>

        {showQuiz && quiz && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 p-8 backdrop-blur-sm">
            {S.quizState === 'results' && quiz.correct !== null && <Confetti pieces={90} />}
            <div className="w-full max-w-4xl space-y-5 rounded-[2rem] bg-white p-8 shadow-2xl animate-pop">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-naranja/10 px-4 py-1 font-extrabold text-naranja">
                  {S.quizState === 'open' ? '❓ ¡Responde en tu celular!' : S.quizState === 'closed' ? '🔒 Pregunta cerrada' : '📊 Resultados'}
                </span>
                <span className="text-xl font-extrabold text-navy">
                  {total} de {Math.max(online.length, total)} respondieron
                </span>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight text-navy">{quiz.question}</h2>
              {S.quizState === 'results' ? (
                <ResultBars quiz={quiz} counts={counts} big />
              ) : (
                <QuizOptions quiz={quiz} selected={null} disabled />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
