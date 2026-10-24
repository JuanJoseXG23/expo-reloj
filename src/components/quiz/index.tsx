import { TimingDiagram } from '../timing/TimingDiagram';
import type { SignalDef } from '../timing/wave';
import type { OptionVisual, Quiz } from '../../content/quizzes';

const LETTERS = ['A', 'B', 'C', 'D'];

const VISUALS: Record<OptionVisual, SignalDef> = {
  rise: { kind: 'digital', name: '', events: [{ t: 2, v: 1 }], initial: 0 },
  fall: { kind: 'digital', name: '', events: [{ t: 2, v: 0 }], initial: 1 },
  high: { kind: 'digital', name: '', events: [], initial: 1 },
  low: { kind: 'digital', name: '', events: [], initial: 0 },
};

export function OptionDrawing({ visual }: { visual: OptionVisual }) {
  return <TimingDiagram from={0} to={4} width={160} rowHeight={54} hideLabels signals={[VISUALS[visual]]} />;
}

/** Botones de opciones (grandes, fáciles de tocar). */
export function QuizOptions({
  quiz,
  selected,
  disabled,
  reveal,
  onPick,
  big = false,
}: {
  quiz: Quiz;
  selected: number | null;
  disabled?: boolean;
  /** mostrar cuál es la correcta. */
  reveal?: boolean;
  onPick?: (i: number) => void;
  /** tamaño para el video beam. */
  big?: boolean;
}) {
  const hasVisual = quiz.options.some((o) => o.visual);
  return (
    <div className={`grid gap-2 ${hasVisual || quiz.options.length === 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {quiz.options.map((o, i) => {
        const isSel = selected === i;
        const isCorrect = reveal && quiz.correct === i;
        const isWrongSel = reveal && isSel && quiz.correct !== null && quiz.correct !== i;
        const tone = isCorrect
          ? 'bg-verde text-white ring-verde'
          : isWrongSel
            ? 'bg-rojo text-white ring-rojo'
            : isSel
              ? 'bg-navy text-white ring-navy'
              : 'bg-white text-navy ring-slate-200';
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onPick?.(i)}
            className={`flex items-center gap-3 rounded-2xl text-left font-bold ring-2 transition active:scale-95 disabled:active:scale-100 ${
              big ? 'px-6 py-5 text-[32px]' : 'px-4 py-3 text-lg'
            } ${tone}`}
          >
            <span className={`grid place-items-center h-9 w-9 shrink-0 rounded-xl text-base ${isSel || isCorrect ? 'bg-white/20' : 'bg-fondo'}`}>
              {LETTERS[i]}
            </span>
            {o.visual ? (
              <span className="flex-1 rounded-lg bg-white p-1">
                <OptionDrawing visual={o.visual} />
              </span>
            ) : (
              <span className="flex-1">{o.text}</span>
            )}
            {isCorrect && <span>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Barras animadas de resultados. */
export function ResultBars({ quiz, counts, big = false }: { quiz: Quiz; counts: number[]; big?: boolean }) {
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {quiz.options.map((o, i) => {
        const n = counts[i] ?? 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        const correct = quiz.correct === i;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-8 shrink-0 font-extrabold ${big ? 'text-2xl' : 'text-lg'} ${correct ? 'text-verde' : 'text-navy'}`}>
              {LETTERS[i]}
            </span>
            <div className={`relative flex-1 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 ${big ? 'h-14' : 'h-10'}`}>
              <div
                className={`bar-grow absolute inset-y-0 left-0 rounded-xl ${correct ? 'bg-verde' : 'bg-azul/70'}`}
                style={{ width: `${pct}%` }}
              />
              <div className={`relative flex h-full items-center justify-between px-3 font-bold ${big ? 'text-xl' : ''}`}>
                <span className={pct > 50 ? 'text-white' : 'text-navy'}>
                  {o.visual ? (o.visual === 'rise' ? 'Sube ↑' : o.visual === 'fall' ? 'Baja ↓' : o.visual === 'high' ? 'Alto' : 'Bajo') : o.text}
                  {correct && ' ✓'}
                </span>
                <span className="text-navy">
                  {n} · {pct} %
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="text-right text-sm font-semibold text-slate-500">{total} respuestas</div>
    </div>
  );
}
