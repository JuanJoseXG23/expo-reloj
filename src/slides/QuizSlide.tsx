import { getQuiz, quizzesOfBlock } from '../content/quizzes';
import { SlideFrame } from '../components/ui';
import { useSlide } from './SlideContext';

/** Pantalla "Mini-quiz" de cada bloque: la pregunta llega en vivo. */
export function makeQuizSlide(block: number) {
  return function QuizSlide() {
    const { session } = useSlide();
    const active = getQuiz(session.activeQuizId);
    const isThisBlock = active?.block === block && session.quizState !== 'idle';
    const quizzes = quizzesOfBlock(block);
    return (
      <SlideFrame emoji="🎯" title="Mini-quiz" text="Las preguntas llegan en vivo. ¡Responde rápido!">
        <div className="grid gap-3">
          {quizzes.map((q, i) => {
            const isActive = active?.id === q.id && isThisBlock;
            return (
              <div
                key={q.id}
                className={`rounded-3xl p-4 sm:p-5 flex items-center gap-4 ring-2 transition ${
                  isActive ? 'bg-naranja text-white ring-naranja scale-[1.02]' : 'bg-white ring-slate-200 text-navy'
                }`}
              >
                <span
                  className={`grid place-items-center h-12 w-12 shrink-0 rounded-2xl text-2xl font-extrabold ${
                    isActive ? 'bg-white text-naranja' : 'bg-fondo text-azul'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-bold text-lg">{isActive ? '¡Ahora! Responde en la tarjeta 👆' : 'Pregunta sorpresa…'}</span>
              </div>
            );
          })}
        </div>
      </SlideFrame>
    );
  };
}
