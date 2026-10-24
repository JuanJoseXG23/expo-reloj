import { getSlide } from '../content/blocks';
import { SlideContext, type SlideMode } from '../slides/SlideContext';
import type { SessionState } from '../lib/types';

/** Dibuja una pantalla con su contexto. La `key` reinicia su estado al cambiar de pantalla. */
export function SlideView({
  block,
  slide,
  session,
  mode,
}: {
  block: number;
  slide: number;
  session: SessionState;
  mode: SlideMode;
}) {
  const def = getSlide(block, slide);
  if (!def) return null;
  const Comp = def.component;
  return (
    <SlideContext.Provider value={{ session, mode }}>
      <Comp key={`${block}-${slide}`} />
    </SlideContext.Provider>
  );
}

/** Vista previa reducida (panel del expositor). Sin interacción. */
export function SlidePreview({ block, slide, session, label }: { block: number; slide: number; session: SessionState; label: string }) {
  const def = getSlide(block, slide);
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-fondo text-xs font-bold text-navy">
        <span>{label}</span>
        <span className="truncate ml-2">{def ? `${def.id} · ${def.title}` : '— fin —'}</span>
      </div>
      <div className="relative h-56 overflow-hidden pointer-events-none" aria-hidden>
        {def && (
          <div className="absolute left-0 top-0 w-[200%] origin-top-left scale-50 p-6">
            <SlideView block={block} slide={slide} session={session} mode="preview" />
          </div>
        )}
      </div>
    </div>
  );
}
