import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { clockEvents, risingEdges, toSegments, type Level, type SignalDef } from './wave';

export interface Phase {
  from: number;
  to: number;
  label: string;
  color?: string;
}

export interface Region {
  from: number;
  to: number;
  color: string;
  label?: string;
  opacity?: number;
  /** filas que cubre (por defecto todas). */
  rows?: number[];
}

export interface Marker {
  t: number;
  label?: string;
  color?: string;
  /** si se indica, el marcador se dibuja solo en esa fila. */
  row?: number;
}

export interface TimingDiagramProps {
  signals: SignalDef[];
  from: number;
  to: number;
  width?: number;
  rowHeight?: number;
  labelWidth?: number;
  /** cajas de encabezado (ej. T1, T2, Tw…). */
  phases?: Phase[];
  regions?: Region[];
  markers?: Marker[];
  /** línea vertical "ahora". */
  cursor?: number;
  /** dibuja las señales solo hasta este instante. */
  revealUntil?: number;
  highlightRow?: number | null;
  onRowClick?: (row: number) => void;
  /** filas que tiemblan (metaestabilidad). */
  shakeRows?: number[];
  hideLabels?: boolean;
  className?: string;
  ariaLabel?: string;
  children?: (helpers: { x: (t: number) => number; rowTop: (i: number) => number; height: number }) => ReactNode;
}

const C = {
  navy: '#1F3A5F',
  blue: '#2E5C8A',
  orange: '#D35400',
  red: '#C0392B',
  grid: '#C9D7E6',
  z: '#7F8C9A',
};

/**
 * Diagrama de tiempo genérico: recibe las señales como datos.
 * - Señal digital: arriba = 1, abajo = 0, línea a la mitad = alta impedancia, zigzag rojo = metaestable.
 * - Bus: hexágonos con el valor dentro.
 * - Reloj: ▲ naranja en cada flanco de subida (opcional).
 */
export function TimingDiagram({
  signals,
  from,
  to,
  width: preferredWidth = 520,
  rowHeight = 50,
  labelWidth = 72,
  phases,
  regions = [],
  markers = [],
  cursor,
  revealUntil,
  highlightRow = null,
  onRowClick,
  shakeRows = [],
  hideLabels = false,
  className = '',
  ariaLabel = 'Diagrama de tiempo',
  children,
}: TimingDiagramProps) {
  const uid = useId().replace(/:/g, '');
  const box = useRef<HTMLDivElement>(null);
  const measured = useMeasuredWidth(box);
  // 1 unidad = 1 px real en el celular (la letra no se encoge); en pantallas grandes se agranda.
  const width = measured ? Math.max(MIN_W, Math.min(MAX_W, measured)) : preferredWidth;
  const lw = hideLabels ? 6 : labelWidth;
  const plotW = width - lw - 8;
  const header = phases && phases.length ? 30 : 8;
  const height = header + signals.length * rowHeight + 4;
  const span = to - from || 1;
  const x = (t: number) => lw + ((t - from) / span) * plotW;
  const clampX = (t: number) => x(Math.min(to, Math.max(from, t)));
  const rowTop = (i: number) => header + i * rowHeight;
  const hiY = (i: number) => rowTop(i) + 10;
  const loY = (i: number) => rowTop(i) + rowHeight - 16;
  const midY = (i: number) => (hiY(i) + loY(i)) / 2;
  const revealX = revealUntil === undefined ? width : clampX(revealUntil);

  return (
    <div ref={box} className="w-full">
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full h-auto select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={`reveal-${uid}`}>
          <rect x={0} y={0} width={revealX} height={height} />
        </clipPath>
        <clipPath id={`plot-${uid}`}>
          <rect x={lw} y={0} width={plotW} height={height} />
        </clipPath>
        <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={C.red} strokeWidth="2" opacity="0.5" />
        </pattern>
      </defs>

      {/* Fondo de filas */}
      {signals.map((_, i) => (
        <rect
          key={`bg${i}`}
          x={0}
          y={rowTop(i)}
          width={width}
          height={rowHeight}
          fill={highlightRow === i ? '#FFF3E0' : i % 2 ? '#F5F9FD' : '#FFFFFF'}
          className={onRowClick ? 'cursor-pointer' : undefined}
          onClick={onRowClick ? () => onRowClick(i) : undefined}
        />
      ))}

      {/* Encabezado de fases (T1, T2, …) */}
      {phases?.map((p, i) => {
        const a = clampX(p.from);
        const b = clampX(p.to);
        if (b - a < 1) return null;
        return (
          <g key={`ph${i}`}>
            <rect
              x={a + 1}
              y={3}
              width={b - a - 2}
              height={header - 7}
              rx={6}
              fill={p.color ?? C.blue}
              opacity={0.9}
            />
            <text x={(a + b) / 2} y={header - 10} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">
              {p.label}
            </text>
          </g>
        );
      })}

      {/* Zonas sombreadas */}
      {regions.map((r, i) => {
        const a = clampX(r.from);
        const b = clampX(r.to);
        const rows = r.rows ?? signals.map((_, k) => k);
        const top = rowTop(Math.min(...rows));
        const bottom = rowTop(Math.max(...rows)) + rowHeight;
        return (
          <g key={`rg${i}`}>
            <rect x={a} y={top} width={Math.max(0, b - a)} height={bottom - top} fill={r.color} opacity={r.opacity ?? 0.22} />
            {r.label && (
              <text x={(a + b) / 2} y={top + 13} textAnchor="middle" fontSize={12} fontWeight={700} fill={r.color}>
                {r.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Señales */}
      <g clipPath={`url(#plot-${uid})`}>
        <g clipPath={`url(#reveal-${uid})`}>
          {signals.map((s, i) => (
            <g key={`sig${i}`} className={shakeRows.includes(i) ? 'animate-shake' : undefined}>
              {renderSignal(s, i)}
            </g>
          ))}
        </g>
      </g>

      {/* Marcadores */}
      {markers.map((m, i) => {
        if (m.t < from || m.t > to) return null;
        const mx = x(m.t);
        const top = m.row === undefined ? header : rowTop(m.row);
        const bottom = m.row === undefined ? height - 4 : rowTop(m.row) + rowHeight;
        const color = m.color ?? C.orange;
        return (
          <g key={`mk${i}`}>
            <line x1={mx} x2={mx} y1={top} y2={bottom} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
            {m.label && (
              <text
                x={Math.min(width - 4, Math.max(lw + 4, mx))}
                y={top + 12}
                textAnchor={mx > width - 60 ? 'end' : mx < lw + 40 ? 'start' : 'middle'}
                fontSize={12}
                fontWeight={800}
                fill={color}
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}

      {cursor !== undefined && cursor >= from && cursor <= to && (
        <line x1={x(cursor)} x2={x(cursor)} y1={header} y2={height - 4} stroke={C.red} strokeWidth={2} opacity={0.7} />
      )}

      {/* Nombres */}
      {!hideLabels &&
        signals.map((s, i) => {
          const y = midY(i) + 5;
          const overline = s.kind === 'digital' && s.activeLow;
          const w = s.name.length * 9.2;
          return (
            <g
              key={`lb${i}`}
              className={onRowClick ? 'cursor-pointer' : undefined}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
            >
              <text x={8} y={y} fontSize={15} fontWeight={800} fill={C.navy} fontFamily="JetBrains Mono, monospace">
                {s.name}
              </text>
              {overline && <line x1={8} x2={8 + w} y1={y - 14} y2={y - 14} stroke={C.navy} strokeWidth={1.8} />}
            </g>
          );
        })}

      {children?.({ x, rowTop, height })}
    </svg>
    </div>
  );

  function renderSignal(s: SignalDef, i: number): ReactNode {
    const color = s.color ?? (s.kind === 'clock' ? C.blue : C.navy);
    if (s.kind === 'bus') return renderBus(s.segments, i, color);
    const events =
      s.kind === 'clock'
        ? clockEvents(from, to, s.period, s.duty ?? 0.5, s.phase ?? 0)
        : s.events.filter((e) => Number.isFinite(e.t));
    const initial: Level = s.kind === 'digital' ? (s.initial ?? 0) : 0;
    const segs = toSegments(
      events.map((e) => ({ t: e.t, value: e.v })),
      initial,
      from,
      to,
    );
    const yOf = (v: Level) => (v === 1 ? hiY(i) : v === 0 ? loY(i) : midY(i));
    const parts: ReactNode[] = [];
    segs.forEach((seg, k) => {
      const a = x(seg.from);
      const b = x(seg.to);
      if (seg.value === 'x') {
        parts.push(
          <g key={k}>
            <rect x={a} y={hiY(i)} width={b - a} height={loY(i) - hiY(i)} fill={`url(#hatch-${uid})`} />
            <path d={zigzag(a, b, hiY(i), loY(i))} fill="none" stroke={C.red} strokeWidth={2.5} strokeLinejoin="round" />
          </g>,
        );
      } else if (seg.value === 'z') {
        parts.push(
          <line key={k} x1={a} x2={b} y1={midY(i)} y2={midY(i)} stroke={C.z} strokeWidth={2.5} strokeDasharray="6 4" />,
        );
      } else {
        if (seg.value === 1)
          parts.push(<rect key={`f${k}`} x={a} y={hiY(i)} width={b - a} height={loY(i) - hiY(i)} fill={color} opacity={0.1} />);
        parts.push(
          <line key={k} x1={a} x2={b} y1={yOf(seg.value)} y2={yOf(seg.value)} stroke={color} strokeWidth={3} strokeLinecap="round" />,
        );
      }
      if (k > 0) {
        const prev = segs[k - 1].value;
        if (prev !== 'x' && seg.value !== 'x')
          parts.push(
            <line key={`v${k}`} x1={a} x2={a} y1={yOf(prev)} y2={yOf(seg.value)} stroke={color} strokeWidth={3} strokeLinecap="round" />,
          );
      }
    });
    if (s.kind === 'clock' && s.marks) {
      for (const r of risingEdges(from, to, s.period, s.phase ?? 0)) {
        const rx = x(r);
        parts.push(
          <path key={`m${r}`} d={`M${rx - 5},${loY(i) + 12} L${rx + 5},${loY(i) + 12} L${rx},${loY(i) + 4} Z`} fill={C.orange} />,
        );
      }
    }
    return parts;
  }

  function renderBus(segments: { t: number; label: string | null }[], i: number, color: string): ReactNode {
    const segs = toSegments(
      segments.map((s) => ({ t: s.t, value: s.label })),
      null as string | null,
      from,
      to,
    );
    const top = hiY(i);
    const bot = loY(i);
    const mid = midY(i);
    return segs.map((seg, k) => {
      const a = x(seg.from);
      const b = x(seg.to);
      if (seg.value === null) {
        return <line key={k} x1={a} x2={b} y1={mid} y2={mid} stroke={C.z} strokeWidth={2.5} strokeDasharray="6 4" />;
      }
      const s = Math.min(7, (b - a) / 2);
      const left = seg.from <= from ? 0 : s;
      const right = seg.to >= to ? 0 : s;
      const d = `M${a},${mid} L${a + left},${top} L${b - right},${top} L${b},${mid} L${b - right},${bot} L${a + left},${bot} Z`;
      // En pantallas angostas, abreviar ("Dirección" → "Dir.") antes que ocultar el texto.
      const fits = (txt: string) => b - a > txt.length * 7.5 + 10;
      const short = seg.value.length > 4 ? `${seg.value.slice(0, 3)}.` : seg.value;
      const label = fits(seg.value) ? seg.value : fits(short) ? short : null;
      return (
        <g key={k}>
          <path d={d} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
          {label && (
            <text x={(a + b) / 2} y={mid + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
              {label}
            </text>
          )}
        </g>
      );
    });
  }
}

const MIN_W = 120;
const MAX_W = 640;

/** Ancho real del contenedor en px (null hasta medirlo). */
function useMeasuredWidth(ref: React.RefObject<HTMLDivElement>) {
  const [w, setW] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setW((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function zigzag(a: number, b: number, top: number, bottom: number): string {
  const step = 6;
  let d = `M${a},${(top + bottom) / 2}`;
  let up = true;
  for (let px = a + step; px <= b; px += step) {
    d += ` L${px},${up ? top + 2 : bottom - 2}`;
    up = !up;
  }
  return d;
}
