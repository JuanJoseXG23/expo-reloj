import { BLOCKS } from '../content/blocks';

/** Fila de 5 círculos (bloques); los bloqueados llevan candado. */
export function BlockDots({
  visible,
  current,
  onPick,
}: {
  visible: number[];
  current: number;
  onPick?: (block: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {BLOCKS.map((b) => {
        const open = visible.includes(b.id);
        const active = b.id === current;
        return (
          <button
            key={b.id}
            disabled={!open || !onPick}
            onClick={() => onPick?.(b.id)}
            title={open ? b.title : 'Bloqueado'}
            className={`grid place-items-center h-11 w-11 sm:h-12 sm:w-12 rounded-full text-lg font-bold transition ${
              active
                ? 'bg-naranja text-white ring-4 ring-naranja/30 scale-110'
                : open
                  ? 'bg-navy text-white active:scale-90'
                  : 'bg-slate-200 text-slate-400'
            }`}
          >
            {open ? b.icon : '🔒'}
          </button>
        );
      })}
    </div>
  );
}
