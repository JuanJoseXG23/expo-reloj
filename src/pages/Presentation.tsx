import { BLOCKS, getSlide } from '../content/blocks';
import { getQuiz } from '../content/quizzes';
import { fullName } from '../content/people';
import { useCounts, useQuizAnswers } from '../hooks/useQuiz';
import { useParticipants } from '../hooks/usePresence';
import { usePresenter } from '../hooks/usePresenter';
import { useSession } from '../hooks/useSession';
import { DECK, ThanksSlide } from '../presentation/deck';
import { DeckContext, Stage } from '../presentation/kit';
import { LobbySlide } from '../presentation/Lobby';
import { QuizOverlay } from '../presentation/QuizOverlay';

/**
 * Perfil "presentación": diapositivas para el video beam.
 * Sigue al panel: cuando el expositor cambia la pantalla interactiva, cambia la diapositiva.
 */
export default function Presentation() {
  const { session: S, meta } = useSession();
  const { status: presenter } = usePresenter();
  const isPresenter = presenter === 'yes';
  const { online } = useParticipants(!meta.local);
  const quiz = getQuiz(S.activeQuizId);
  const slide = getSlide(S.currentBlock, S.currentSlide);
  // En 3.6 la diapositiva ya muestra los votos del gancho: no la tapamos.
  const coveredBySlide = quiz?.id === 'gancho' && slide?.id === '3.6';
  const showQuiz = Boolean(quiz) && S.quizState !== 'idle' && S.status === 'live' && !coveredBySlide;
  // Las reglas solo dejan leer respuestas ajenas en "resultados" (o siempre si este equipo es expositor).
  const answers = useQuizAnswers(quiz?.id ?? null, !meta.local && (isPresenter || S.quizState === 'results'));
  const counts = useCounts(answers, quiz?.id ?? null);

  const block = BLOCKS[S.currentBlock];
  const Comp = slide ? DECK[slide.id] : undefined;
  const speaker = S.currentSpeaker === 'Los tres' ? 'Los tres' : fullName(S.currentSpeaker);

  const goFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => undefined);

  return (
    <div onDoubleClick={goFullscreen} title="Doble clic: pantalla completa">
      <Stage>
        {S.status === 'lobby' ? (
          <LobbySlide online={online} />
        ) : S.status === 'ended' ? (
          <ThanksSlide />
        ) : (
          <DeckContext.Provider
            value={{ session: S, code: slide?.id ?? '', kicker: `${block?.icon ?? ''} ${block?.title ?? ''} · ${speaker}` }}
          >
            {Comp && <Comp key={slide?.id} />}
          </DeckContext.Provider>
        )}

        {S.status === 'live' && (
          <div className="absolute bottom-8 right-12 flex items-center gap-4">
            <div className="flex gap-2">
              {BLOCKS.map((b) => (
                <span
                  key={b.id}
                  className={`h-4 rounded-full transition-all ${
                    b.id === S.currentBlock ? 'w-12 bg-naranja' : S.unlockedBlocks.includes(b.id) ? 'w-4 bg-navy' : 'w-4 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[20px] font-extrabold text-navy ring-1 ring-slate-200">
              <span className="live-dot h-3 w-3 rounded-full bg-red-500" /> 👥 {online.length}
            </span>
          </div>
        )}

        {showQuiz && quiz && (
          <QuizOverlay quiz={quiz} state={S.quizState} counts={counts} online={online.length} showLiveCount={isPresenter} />
        )}
      </Stage>
    </div>
  );
}
