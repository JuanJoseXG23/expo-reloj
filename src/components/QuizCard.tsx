import { useEffect, useState } from 'react';
import { getQuiz } from '../content/quizzes';
import { submitAnswer, useCounts, useMyAnswer, useQuizAnswers } from '../hooks/useQuiz';
import type { SessionState } from '../lib/types';
import { QuizOptions, ResultBars } from './quiz';
import { Confetti } from './ui/Confetti';

/** Tarjeta de pregunta del estudiante: aparece sola cuando el expositor lanza una pregunta. */
export function QuizCard({ session, uid, name }: { session: SessionState; uid: string | null; name: string }) {
  const quiz = getQuiz(session.activeQuizId);
  const state = session.quizState;
  const myOption = useMyAnswer(uid, quiz?.id ?? null);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const showResults = state === 'results';
  const answers = useQuizAnswers(quiz?.id ?? null, showResults);
  const counts = useCounts(answers, quiz?.id ?? null);

  // Si cambia la pregunta o su estado, vuelve a mostrarse.
  useEffect(() => {
    setHidden(false);
    setPending(null);
    setError(null);
  }, [quiz?.id, state]);

  if (!quiz || state === 'idle') return null;

  const selected = pending ?? myOption;
  const won = showResults && quiz.correct !== null && myOption === quiz.correct;

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-24 right-4 z-30 rounded-full bg-naranja px-5 py-3 font-bold text-white shadow-lg animate-pop"
      >
        ❓ Pregunta
      </button>
    );
  }

  const pick = (i: number) => {
    if (!uid || state !== 'open') return;
    setPending(i);
    setError(null);
    submitAnswer(uid, name, quiz.id, i).catch(() => {
      setPending(null);
      setError('No se pudo enviar. Intenta de nuevo.');
    });
  };

  return (
    <div className="rounded-3xl bg-white p-4 shadow-xl ring-2 ring-naranja animate-pop">
      {won && <Confetti />}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-naranja/10 px-3 py-1 text-xs font-extrabold text-naranja">
          {state === 'open' ? '❓ PREGUNTA EN VIVO' : state === 'closed' ? '🔒 CERRADA' : '📊 RESULTADOS'}
        </span>
        <button onClick={() => setHidden(true)} className="text-sm font-bold text-slate-400 px-2 py-1">
          Ocultar ✕
        </button>
      </div>
      <h3 className="mt-2 text-xl font-extrabold text-navy leading-snug">{quiz.question}</h3>
      <div className="mt-3">
        {showResults ? (
          <>
            <ResultBars quiz={quiz} counts={counts} />
            <div className="mt-2 rounded-2xl bg-azul/10 px-3 py-2 font-bold text-navy">💡 {quiz.explain}</div>
          </>
        ) : (
          <QuizOptions quiz={quiz} selected={selected} disabled={state !== 'open'} onPick={pick} />
        )}
      </div>
      <div className="mt-2 text-center text-sm font-bold">
        {error ? (
          <span className="text-rojo">{error}</span>
        ) : showResults ? (
          quiz.correct === null ? (
            <span className="text-navy">¡Gracias por votar!</span>
          ) : myOption === null ? (
            <span className="text-slate-500">No respondiste esta vez.</span>
          ) : won ? (
            <span className="text-verde">¡Acertaste! 🎉</span>
          ) : (
            <span className="text-rojo">Casi… la correcta está en verde.</span>
          )
        ) : state === 'open' ? (
          <span className="text-slate-500">{selected === null ? 'Toca una opción' : 'Listo ✓ Puedes cambiarla mientras esté abierta.'}</span>
        ) : (
          <span className="text-slate-500">{myOption === null ? 'Se cerró la pregunta.' : 'Respuesta guardada ✓ Espera los resultados.'}</span>
        )}
      </div>
    </div>
  );
}
