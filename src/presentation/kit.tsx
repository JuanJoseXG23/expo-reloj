// Piezas para armar las diapositivas del video beam (lienzo fijo de 1600 × 900).
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_SESSION, type SessionState } from '../lib/types';

export const STAGE_W = 1600;
export const STAGE_H = 900;

/** Lienzo 16:9 que se escala para llenar la pantalla sin deformarse. */
export function Stage({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="fixed inset-0 grid place-items-center overflow-hidden bg-navy">
      <div
        className="relative overflow-hidden bg-fondo"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        {children}
      </div>
    </div>
  );
}

export interface DeckCtx {
  session: SessionState;
  code: string;
  kicker: string;
}

export const DeckContext = createContext<DeckCtx>({ session: DEFAULT_SESSION, code: '', kicker: '' });

export function useDeck() {
  return useContext(DeckContext);
}

/** Diapositiva estándar: encabezado, título grande, contenido y llamado al celular. */
export function DeckSlide({ title, children, phone }: { title: ReactNode; children?: ReactNode; phone?: ReactNode }) {
  const { code, kicker } = useDeck();
  return (
    <div className="absolute inset-0 flex flex-col px-16 pb-24 pt-12 animate-pop">
      <div className="flex items-center justify-between text-[22px] font-bold text-azul">
        <span>{kicker}</span>
        <span className="font-mono text-naranja">{code}</span>
      </div>
      <h1 className="mt-1 text-[60px] font-extrabold leading-[1.08] text-navy" style={{ textWrap: 'balance' }}>
        {title}
      </h1>
      <div className="mt-8 min-h-0 flex-1">{children}</div>
      {phone && <PhoneCta>{phone}</PhoneCta>}
    </div>
  );
}

/** "📱 En tu celular: …" — lo que deben tocar los estudiantes ahora. */
export function PhoneCta({ children }: { children: ReactNode }) {
  return (
    <div className="absolute bottom-7 left-16 flex max-w-[1180px] items-center gap-4 rounded-full bg-naranja px-7 py-3 text-[26px] font-bold text-white shadow-lg">
      <span className="text-[30px]">📱</span>
      <span>{children}</span>
    </div>
  );
}

export function Cols({ children, left = '1fr', right = '1fr' }: { children: ReactNode; left?: string; right?: string }) {
  return (
    <div className="grid h-full items-center gap-12" style={{ gridTemplateColumns: `${left} ${right}` }}>
      {children}
    </div>
  );
}

/** Lista de ideas en letra grande (máximo 4 por diapositiva). */
export function Points({ items, active }: { items: ReactNode[]; active?: number }) {
  return (
    <ul className="space-y-6">
      {items.map((it, i) => (
        <li
          key={i}
          className={`flex gap-5 text-[34px] font-semibold leading-snug transition ${
            active === undefined || active === i ? 'text-navy' : 'text-slate-400'
          }`}
        >
          <span
            className={`mt-[14px] h-4 w-4 shrink-0 rounded-full ${active === i ? 'bg-naranja scale-125' : 'bg-azul'}`}
            aria-hidden
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>;
}

/** Fórmula o cuenta destacada. */
export function Formula({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <div
      className={`rounded-[24px] bg-navy px-8 py-5 text-center font-mono font-bold text-white ${
        small ? 'text-[30px]' : 'text-[40px]'
      }`}
    >
      {children}
    </div>
  );
}

export function Hl({ children }: { children: ReactNode }) {
  return <span className="text-naranja">{children}</span>;
}
