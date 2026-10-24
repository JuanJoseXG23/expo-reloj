import { useEffect, useState } from 'react';
import { BLOCKS } from '../content/blocks';

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Cronómetro con los tiempos objetivo; se pone naranja/rojo si nos pasamos. */
export function Timer({ startedAt, block, compact = false }: { startedAt: number | null; block: number; compact?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = startedAt ? now - startedAt : 0;
  const minutes = elapsed / 60000;
  const [, end] = BLOCKS[block]?.target ?? [0, 20];
  const over = minutes - end;
  const tone = !startedAt
    ? 'bg-slate-200 text-slate-500'
    : over > 1 || minutes > 20
      ? 'bg-rojo text-white'
      : over > 0
        ? 'bg-naranja text-white'
        : 'bg-verde text-white';

  if (compact) return <span className={`rounded-xl px-3 py-1 font-mono font-bold ${tone}`}>{mmss(elapsed)}</span>;

  return (
    <div className="space-y-2">
      <div className={`rounded-2xl px-4 py-3 text-center transition ${tone}`}>
        <div className="font-mono text-4xl font-extrabold">{mmss(elapsed)}</div>
        <div className="text-sm font-bold opacity-90">
          {startedAt ? (over > 0 ? `+${mmss(over * 60000)} sobre el objetivo` : `Objetivo del bloque: hasta ${mmss(end * 60000)}`) : 'Sin iniciar'}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 text-[11px] font-bold text-center">
        {BLOCKS.map((b) => (
          <div key={b.id} className={`rounded-lg px-1 py-1 ${b.id === block ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>
            {b.icon} {mmss(b.target[0] * 60000)}–{mmss(b.target[1] * 60000)}
          </div>
        ))}
      </div>
    </div>
  );
}
