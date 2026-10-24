import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BLOCKS } from '../content/blocks';
import { fullName } from '../content/people';
import { DEFAULT_SESSION } from '../lib/types';
import { DECK } from '../presentation/deck';
import { DeckContext, Stage } from '../presentation/kit';
import { LobbySlide } from '../presentation/Lobby';

const ORDER = ['lobby', ...BLOCKS.flatMap((b) => b.slides.map((s) => s.id))];

// Compañeros de ejemplo para ver cómo se ve el lobby con gente conectada (solo en ensayo).
const SAMPLE = ['Laura', 'Andrés', 'Valentina', 'Santiago', 'Camila', 'Mateo', 'Daniela', 'Sebastián', 'Mariana', 'Felipe', 'Sofía', 'Nicolás', 'Isabella', 'Juan Pablo'].map(
  (name, i) => ({ uid: `ensayo-${i}-${name}`, name, lastSeen: 0 }),
);

/** Modo ensayo: recorre las diapositivas con ← → sin tocar la sesión en vivo. */
export default function Rehearsal() {
  const { id = 'lobby' } = useParams();
  const navigate = useNavigate();
  const index = Math.max(0, ORDER.indexOf(id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') navigate(`/presentacion/ensayo/${ORDER[Math.min(ORDER.length - 1, index + 1)]}`);
      if (e.key === 'ArrowLeft') navigate(`/presentacion/ensayo/${ORDER[Math.max(0, index - 1)]}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, navigate]);

  const slideId = ORDER[index];
  const block = BLOCKS.find((b) => b.slides.some((s) => s.id === slideId));
  const Comp = DECK[slideId];
  const session = { ...DEFAULT_SESSION, status: 'live' as const, currentBlock: block?.id ?? 0 };

  return (
    <Stage>
      {slideId === 'lobby' || !Comp ? (
        <LobbySlide online={SAMPLE} />
      ) : (
        <DeckContext.Provider value={{ session, code: slideId, kicker: `${block?.icon} ${block?.title} · ${fullName(block?.speaker ?? '')}` }}>
          <Comp key={slideId} />
        </DeckContext.Provider>
      )}
      <div className="absolute right-6 top-4 rounded-full bg-navy/80 px-4 py-1 text-[18px] font-bold text-white">
        Ensayo · {index + 1}/{ORDER.length} · ← →
      </div>
    </Stage>
  );
}
