// Modelo de datos de los diagramas de tiempo + utilidades puras.

/** 1 = alto, 0 = bajo, 'z' = alta impedancia (nadie lo usa), 'x' = metaestable/indefinido. */
export type Level = 0 | 1 | 'z' | 'x';

export interface DigitalEvent {
  t: number;
  v: Level;
}

/** Tramo de un bus: desde `t` vale `label` (null = alta impedancia). */
export interface BusSegment {
  t: number;
  label: string | null;
}

export type SignalDef =
  | {
      kind: 'clock';
      name: string;
      period: number;
      /** fracción del periodo en alto (0…1). */
      duty?: number;
      /** instante de la primera subida. */
      phase?: number;
      /** dibuja ▲ en los flancos de subida. */
      marks?: boolean;
      color?: string;
    }
  | {
      kind: 'digital';
      name: string;
      events: DigitalEvent[];
      initial?: Level;
      /** activa en bajo: el nombre lleva raya encima. */
      activeLow?: boolean;
      color?: string;
    }
  | {
      kind: 'bus';
      name: string;
      segments: BusSegment[];
      color?: string;
    };

export interface Segment<T> {
  from: number;
  to: number;
  value: T;
}

/** Nivel del reloj en el instante t. */
export function clockLevelAt(t: number, period: number, duty = 0.5, phase = 0): 0 | 1 {
  const x = (((t - phase) % period) + period) % period;
  return x < duty * period ? 1 : 0;
}

/** Instantes de flanco de subida en [a, b). */
export function risingEdges(a: number, b: number, period: number, phase = 0): number[] {
  const out: number[] = [];
  let k = Math.ceil((a - phase) / period);
  for (let t = phase + k * period; t < b; t = phase + ++k * period) out.push(t);
  return out;
}

/** Convierte un reloj en eventos digitales dentro de la ventana [from, to]. */
export function clockEvents(from: number, to: number, period: number, duty = 0.5, phase = 0): DigitalEvent[] {
  const events: DigitalEvent[] = [{ t: from, v: clockLevelAt(from, period, duty, phase) }];
  for (const r of risingEdges(from - period, to + period, period, phase)) {
    if (r > from && r < to) events.push({ t: r, v: 1 });
    const f = r + duty * period;
    if (f > from && f < to) events.push({ t: f, v: 0 });
  }
  return events.sort((x, y) => x.t - y.t);
}

/** Corta una lista de eventos en tramos constantes dentro de [from, to]. */
export function toSegments<T>(events: { t: number; value: T }[], initial: T, from: number, to: number): Segment<T>[] {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  let current = initial;
  for (const e of sorted) if (e.t <= from) current = e.value;
  const segs: Segment<T>[] = [];
  let start = from;
  for (const e of sorted) {
    if (e.t <= from) continue;
    if (e.t >= to) break;
    if (e.value === current) continue;
    segs.push({ from: start, to: e.t, value: current });
    start = e.t;
    current = e.value;
  }
  segs.push({ from: start, to, value: current });
  return segs;
}
