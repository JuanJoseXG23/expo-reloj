import { useState } from 'react';
import { quizzesOfBlock, type Quiz } from '../content/quizzes';
import { QuizOptions } from '../components/quiz';
import { SlideFrame, Ves } from '../components/ui';
import { useSlide } from './SlideContext';

/**
 * Pantalla "Mini-quiz" de cada bloque.
 * - Antes de lanzarla: solo el tema (sin revelar la pregunta).
 * - Mientras está activa: aviso para responder en la tarjeta.
 * - Después de los resultados (o en repaso): práctica tocando, con explicación.
 */
export function makeQuizSlide(block: number) {
  return function QuizSlide() {
    const { session } = useSlide();
    const quizzes = quizzesOfBlock(block);
    const review = session.status === 'ended';
    const doneCount = quizzes.filter((q) => review || session.doneQuizzes.includes(q.id)).length;
    return (
      <SlideFrame
        emoji="🎯"
        title="Mini-quiz"
        text={doneCount === quizzes.length ? 'Practica otra vez: toca una opción.' : 'Las preguntas llegan en vivo. ¡Responde rápido!'}
      >
        <div className="grid gap-3">
          {quizzes.map((q, i) => {
            const active = session.activeQuizId === q.id && session.quizState !== 'idle' && session.quizState !== 'results';
            const done = review || session.doneQuizzes.includes(q.id);
            if (active) return <ActiveCard key={q.id} n={i + 1} quiz={q} />;
            if (done) return <PracticeCard key={q.id} n={i + 1} quiz={q} />;
            return <LockedCard key={q.id} n={i + 1} quiz={q} />;
          })}
        </div>
      </SlideFrame>
    );
  };
}

function Num({ n, tone }: { n: number; tone: 'light' | 'dark' }) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl font-extrabold ${
        tone === 'dark' ? 'bg-white text-naranja' : 'bg-fondo text-azul'
      }`}
    >
      {n}
    </span>
  );
}

function LockedCard({ n, quiz }: { n: number; quiz: Quiz }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-2 ring-slate-200">
      <Num n={n} tone="light" />
      <div className="min-w-0">
        <div className="text-lg font-extrabold text-navy">{quiz.topic}</div>
        <div className="text-sm font-semibold text-slate-500">🔒 Pregunta sorpresa… atento al expositor</div>
      </div>
    </div>
  );
}

function ActiveCard({ n, quiz }: { n: number; quiz: Quiz }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-naranja p-4 text-white ring-2 ring-naranja animate-pop">
      <Num n={n} tone="dark" />
      <div className="min-w-0">
        <div className="text-lg font-extrabold">{quiz.topic}</div>
        <div className="font-bold">¡Ahora! Responde en la tarjeta de pregunta 👆</div>
      </div>
    </div>
  );
}

/** Práctica local: no se guarda nada, solo para repasar. */
function PracticeCard({ n, quiz }: { n: number; quiz: Quiz }) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked !== null && picked === quiz.correct;
  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 ring-2 ring-slate-200">
      <div className="flex items-center gap-3">
        <Num n={n} tone="light" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-500">{quiz.topic}</div>
          <div className="text-lg font-extrabold leading-snug text-navy">{quiz.question}</div>
        </div>
      </div>
      <QuizOptions quiz={quiz} selected={picked} reveal={picked !== null} onPick={setPicked} />
      {picked !== null && (
        <Ves tone={quiz.correct === null || ok ? 'green' : 'red'}>
          {quiz.correct === null ? '' : ok ? '¡Correcto! ' : 'Casi. '}
          {quiz.explain}
        </Ves>
      )}
    </div>
  );
}
