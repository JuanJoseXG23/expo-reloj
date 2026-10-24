import type { Quiz } from '../content/quizzes';
import { QuizOptions, ResultBars } from '../components/quiz';
import { Confetti } from '../components/ui/Confetti';
import type { QuizState } from '../lib/types';

/** Pregunta en vivo en el video beam. El conteo en vivo solo se ve si este equipo es expositor (lo exigen las reglas). */
export function QuizOverlay({
  quiz,
  state,
  counts,
  online,
  showLiveCount,
}: {
  quiz: Quiz;
  state: QuizState;
  counts: number[];
  online: number;
  showLiveCount: boolean;
}) {
  const total = counts.reduce((a, b) => a + b, 0);
  const results = state === 'results';
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-navy/70 px-24 py-16">
      {results && quiz.correct !== null && <Confetti pieces={90} />}
      <div className="w-full space-y-6 rounded-[40px] bg-white p-12 shadow-2xl animate-pop">
        <div className="flex items-center justify-between gap-6">
          <span className="rounded-full bg-naranja/10 px-6 py-2 text-[28px] font-extrabold text-naranja">
            {state === 'open' ? '❓ ¡Responde en tu celular!' : state === 'closed' ? '🔒 Pregunta cerrada' : '📊 Resultados'}
          </span>
          {(showLiveCount || results) && (
            <span className="text-[30px] font-extrabold text-navy">
              {total} de {Math.max(online, total)} respondieron
            </span>
          )}
        </div>
        <h2 className="text-[54px] font-extrabold leading-tight text-navy">{quiz.question}</h2>
        {results ? (
          <>
            <ResultBars quiz={quiz} counts={counts} big />
            <div className="rounded-3xl bg-azul/10 px-8 py-4 text-[32px] font-bold text-navy">💡 {quiz.explain}</div>
          </>
        ) : (
          <QuizOptions quiz={quiz} selected={null} disabled big />
        )}
      </div>
    </div>
  );
}
