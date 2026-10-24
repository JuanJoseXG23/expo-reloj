import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TimingDiagram, type Marker } from '../../components/timing/TimingDiagram';
import type { DigitalEvent, Level, SignalDef } from '../../components/timing/wave';
import { Btn, Card, SlideFrame, Slider, Stat, Ves } from '../../components/ui';
import { useAnimTime } from '../../hooks/useAnimTime';
import { maxFreqHz } from '../../lib/calc';
import { fmtFreq } from '../../lib/format';

/** Repite un patrón de eventos de duración `len` para cubrir [from, to]. */
function repeat<T extends { t: number }>(pattern: T[], len: number, from: number, to: number): T[] {
  const out: T[] = [];
  for (let k = Math.floor(from / len) - 1; k * len < to; k++) {
    for (const e of pattern) out.push({ ...e, t: e.t + k * len });
  }
  return out;
}

// 2.1 ¿Qué es un diagrama de tiempo?
const ROW_INFO = ['El reloj: marca el ritmo.', 'Cable A: se prende y se apaga.', 'Cable B: sigue a A, más tarde.', 'Bus: muchos cables juntos.'];

export function QueEs() {
  const [running, setRunning] = useState(true);
  const [t] = useAnimTime(running, 1.2);
  const [row, setRow] = useState<number | null>(null);
  const from = t - 8;
  const to = t;
  const signals: SignalDef[] = [
    { kind: 'clock', name: 'CLK', period: 1, marks: true },
    {
      kind: 'digital',
      name: 'A',
      events: repeat<DigitalEvent>([{ t: 0, v: 1 }, { t: 2, v: 0 }, { t: 3, v: 1 }, { t: 4, v: 0 }], 6, from, to),
    },
    {
      kind: 'digital',
      name: 'B',
      events: repeat<DigitalEvent>([{ t: 1, v: 1 }, { t: 3, v: 0 }, { t: 4, v: 1 }, { t: 5, v: 0 }], 6, from, to),
    },
    {
      kind: 'bus',
      name: 'BUS',
      segments: repeat([{ t: 0, label: '3F' }, { t: 2, label: null }, { t: 3, label: 'A7' }, { t: 5, label: '12' }], 6, from, to),
    },
  ];
  return (
    <SlideFrame emoji="📈" title="¿Qué es un diagrama de tiempo?" text="Es como un video de lo que hace cada cable, pero dibujado.">
      <Card>
        <TimingDiagram from={from} to={to} cursor={t} signals={signals} highlightRow={row} onRowClick={setRow} />
      </Card>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={() => setRunning(!running)}>
          {running ? '⏸ Pausa' : '▶ Seguir'}
        </Btn>
      </div>
      <Ves>{row === null ? 'Toca una fila para saber qué es 👆' : ROW_INFO[row]}</Ves>
    </SlideFrame>
  );
}

// 2.2 ¿Qué significa cada dibujo?
const SYMBOLS: { label: string; text: string; signal: SignalDef }[] = [
  { label: '1', text: 'Arriba: el cable vale 1.', signal: { kind: 'digital', name: 'X', events: [], initial: 1 } },
  { label: '0', text: 'Abajo: el cable vale 0.', signal: { kind: 'digital', name: 'X', events: [], initial: 0 } },
  {
    label: 'Bus',
    text: 'Hexágono: muchos bits a la vez (un bus).',
    signal: { kind: 'bus', name: 'X', segments: [{ t: 0, label: '3F' }, { t: 2, label: 'A7' }] },
  },
  { label: 'Libre', text: 'Línea a la mitad: nadie usa el cable.', signal: { kind: 'digital', name: 'X', events: [], initial: 'z' } },
  {
    label: 'RD',
    text: 'Raya encima: funciona cuando vale 0.',
    signal: { kind: 'digital', name: 'RD', activeLow: true, events: [{ t: 0, v: 1 }, { t: 1, v: 0 }, { t: 3, v: 1 }] },
  },
];

export function Simbolos() {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <SlideFrame emoji="🔤" title="¿Qué significa cada dibujo?" text="Toca cada símbolo.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SYMBOLS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSel(i)}
            className={`rounded-3xl p-2 ring-2 transition active:scale-95 ${
              sel === i ? 'bg-naranja/10 ring-naranja scale-[1.03]' : 'bg-white ring-slate-200'
            }`}
          >
            <TimingDiagram
              from={0}
              to={4}
              width={260}
              rowHeight={64}
              labelWidth={58}
              hideLabels={s.signal.kind !== 'digital' || !s.signal.activeLow}
              signals={[s.signal]}
            />
          </button>
        ))}
      </div>
      <Ves tone={sel === null ? 'blue' : 'orange'}>{sel === null ? 'Toca un dibujo 👆' : SYMBOLS[sel].text}</Ves>
    </SlideFrame>
  );
}

// 2.3 Nada es instantáneo (compuerta NOT con retardo)
interface Toggle {
  t: number;
  v: 0 | 1;
  delay: number;
}

function levelAt(events: DigitalEvent[], t: number, initial: Level): Level {
  let v = initial;
  for (const e of events) if (e.t <= t) v = e.v;
  return v;
}

export function Retardo() {
  const [delay, setDelay] = useState(10);
  const [t] = useAnimTime(true, 10); // 10 ns por segundo real: cámara lenta
  const [toggles, setToggles] = useState<Toggle[]>([]);
  const a = toggles.length ? toggles[toggles.length - 1].v : 0;
  const aEvents = toggles.map((x) => ({ t: x.t, v: x.v }));
  const yEvents = toggles.map((x) => ({ t: x.t + x.delay, v: (1 - x.v) as 0 | 1 }));
  const yNow = levelAt(yEvents, t, 1);
  const last = toggles[toggles.length - 1];

  const flip = () => setToggles((list) => [...list.filter((x) => x.t > t - 80), { t, v: a ? 0 : 1, delay }]);

  return (
    <SlideFrame emoji="🐌" title="Nada es instantáneo" text="Una compuerta NOT invierte la entrada… pero tarda un poquito.">
      <div className="flex items-center justify-center gap-3 text-2xl font-extrabold">
        <Lamp on={a === 1} label="A" />
        <svg viewBox="0 0 80 50" className="h-14 w-24" aria-label="Compuerta NOT">
          <path d="M8 5 L58 25 L8 45 Z" fill="#fff" stroke="#1F3A5F" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="66" cy="25" r="7" fill="#fff" stroke="#1F3A5F" strokeWidth="4" />
        </svg>
        <Lamp on={yNow === 1} label="Y" />
      </div>
      <Card>
        <TimingDiagram
          from={t - 60}
          to={t}
          cursor={t}
          signals={[
            { kind: 'digital', name: 'A', events: aEvents, initial: 0 },
            { kind: 'digital', name: 'Y', events: yEvents, initial: 1, color: '#D35400' },
          ]}
          regions={
            last && last.delay > 0
              ? [{ from: last.t, to: last.t + last.delay, color: '#D35400', label: `${last.delay} ns` }]
              : []
          }
        />
      </Card>
      <Btn big onClick={flip}>
        Cambiar A ({a} → {a ? 0 : 1})
      </Btn>
      <Slider label="Retardo" min={0} max={30} value={delay} onChange={setDelay} display={`${delay} ns`} accent="#D35400" />
      {last && <Ves>{last.delay ? `¿Ves? Y llegó ${last.delay} ns tarde.` : 'Retardo 0… eso no existe en la vida real 😉'}</Ves>}
    </SlideFrame>
  );
}

function Lamp({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`grid place-items-center h-14 w-14 rounded-full text-white transition ${
          on ? 'bg-naranja shadow-[0_0_20px_#D35400]' : 'bg-slate-300'
        }`}
      >
        {on ? 1 : 0}
      </div>
      <span className="text-sm text-navy">{label}</span>
    </div>
  );
}

// 2.4 Flip-flop D (la estrella)
const FF_PERIOD = 2;

export function FlipFlopD() {
  const [running, setRunning] = useState(true);
  const [t, setT, tRef] = useAnimTime(running, 1, 0.3);
  const [d, setD] = useState<0 | 1>(0);
  const sim = useRef({
    prevT: 0.3,
    d: 0 as 0 | 1,
    q: 0 as 0 | 1,
    dEvents: [] as DigitalEvent[],
    qEvents: [] as DigitalEvent[],
    pending: [] as number[], // instantes de cambios de D desde el último ▲
    markers: [] as Marker[],
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [, bump] = useState(0);

  // Procesa los flancos de subida que ocurrieron desde el último cuadro.
  useEffect(() => {
    const s = sim.current;
    const startK = Math.floor(s.prevT / FF_PERIOD) + 1;
    for (let k = startK; k * FF_PERIOD <= t; k++) {
      const edge = k * FF_PERIOD;
      // Todos los cambios de D antes del último fueron ignorados.
      const ignored = s.pending.slice(0, -1);
      for (const it of ignored) s.markers.push({ t: it, label: 'ignorado', color: '#C0392B', row: 1 });
      if (ignored.length) setMsg('¿Ves? Q solo hace caso en ▲. Lo de en medio se ignora.');
      s.pending = [];
      const dVal = levelAt(s.dEvents, edge, 0) as 0 | 1;
      if (dVal !== s.q) {
        s.q = dVal;
        s.qEvents.push({ t: edge, v: dVal });
        s.markers.push({ t: edge, label: '✓ copia', color: '#1E8449', row: 2 });
        if (!ignored.length) setMsg(`¿Ves? Q copió el ${dVal} justo cuando subió el reloj ▲`);
      }
      bump((v) => v + 1); // vuelve a dibujar aunque esté en pausa (paso a paso)
    }
    s.prevT = t;
    const old = t - 20;
    s.dEvents = s.dEvents.filter((e, i, arr) => e.t > old || i === arr.length - 1);
    s.qEvents = s.qEvents.filter((e, i, arr) => e.t > old || i === arr.length - 1);
    s.markers = s.markers.filter((m) => m.t > old);
  }, [t]);

  const flipD = () => {
    const s = sim.current;
    const v = (s.d ? 0 : 1) as 0 | 1;
    s.d = v;
    s.dEvents.push({ t: tRef.current, v });
    s.pending.push(tRef.current);
    setD(v);
    setMsg(`D ahora es ${v}… espera el ▲`);
  };

  const step = () => {
    const nextEdge = (Math.floor(tRef.current / FF_PERIOD) + 1) * FF_PERIOD;
    setT(nextEdge + 0.25);
  };

  const s = sim.current;
  return (
    <SlideFrame emoji="⭐" title="Flip-flop D" text="Q copia a D solo cuando el reloj sube ▲.">
      <Card>
        <TimingDiagram
          from={t - 9}
          to={t + 0.5}
          cursor={t}
          signals={[
            { kind: 'clock', name: 'CLK', period: FF_PERIOD, marks: true },
            { kind: 'digital', name: 'D', events: s.dEvents, initial: 0, color: '#D35400' },
            { kind: 'digital', name: 'Q', events: s.qEvents, initial: 0, color: '#1E8449' },
          ]}
          markers={s.markers}
        />
      </Card>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-stretch">
        <Btn big variant={d ? 'accent' : 'secondary'} onClick={flipD} className="text-2xl">
          D = {d} <span className="text-base font-semibold opacity-80">(toca)</span>
        </Btn>
        <div className="rounded-2xl bg-verde text-white px-5 grid place-items-center text-2xl font-extrabold">Q = {s.q}</div>
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={() => setRunning(!running)}>
          {running ? '⏸ Pausa' : '▶ Seguir'}
        </Btn>
        <Btn variant="secondary" disabled={running} onClick={step}>
          ⏭ Paso a paso
        </Btn>
      </div>
      {msg && <Ves tone={msg.includes('ignora') ? 'red' : msg.startsWith('¿Ves') ? 'green' : 'blue'}>{msg}</Ves>}
    </SlideFrame>
  );
}

// 2.5 Llegaste tarde (metaestabilidad)
const META = { from: 0.4, to: 3.6, edge: 2, setup: 0.3, hold: 0.15, width: 520, label: 72 };

export function LlegasteTarde() {
  const [tD, setTD] = useState(1.0);
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const zoneA = META.edge - META.setup;
  const zoneB = META.edge + META.hold;
  const inZone = tD >= zoneA && tD <= zoneB;
  const late = tD > zoneB;

  const qEvents: DigitalEvent[] = inZone
    ? [{ t: META.edge + 0.1, v: 'x' }, { t: META.edge + 0.9, v: 1 }]
    : late
      ? []
      : [{ t: META.edge + 0.1, v: 1 }];

  const moveTo = (e: ReactPointerEvent) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // El diagrama dibuja 1 unidad por px (máx. 640): convertimos el dedo a esas unidades.
    const units = Math.max(120, Math.min(640, r.width));
    const svgX = ((e.clientX - r.left) / r.width) * units;
    const plotW = units - META.label - 8;
    const t = META.from + ((svgX - META.label) / plotW) * (META.to - META.from);
    setTD(Math.min(META.to - 0.1, Math.max(META.from + 0.1, Math.round(t * 20) / 20)));
  };

  return (
    <SlideFrame emoji="⏰" title="Llegaste tarde" text="Arrastra el momento en que cambia D. Evita la zona roja.">
      <Card>
        <div
          ref={wrap}
          className="touch-none cursor-ew-resize"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            moveTo(e);
          }}
          onPointerMove={(e) => dragging.current && moveTo(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <TimingDiagram
            from={META.from}
            to={META.to}
            width={META.width}
            labelWidth={META.label}
            rowHeight={62}
            signals={[
              { kind: 'clock', name: 'CLK', period: 2, marks: true },
              { kind: 'digital', name: 'D', events: [{ t: tD, v: 1 }], initial: 0, color: '#D35400' },
              { kind: 'digital', name: 'Q', events: qEvents, initial: 0, color: inZone ? '#C0392B' : '#1E8449' },
            ]}
            regions={[{ from: zoneA, to: zoneB, color: '#C0392B', label: 'zona prohibida', opacity: 0.2 }]}
            markers={[{ t: tD, label: '↔', color: '#D35400', row: 1 }]}
            shakeRows={inZone ? [2] : []}
          />
        </div>
      </Card>
      <Slider label="Cambio de D" min={META.from + 0.1} max={META.to - 0.1} step={0.05} value={tD} onChange={setTD} display="↔" accent="#D35400" />
      {inZone ? (
        <Ves tone="red">¡Muy tarde! El flip-flop se confunde. 😵</Ves>
      ) : late ? (
        <Ves tone="green">Perfecto ✓ Llegó después: Q lo copiará en el próximo ▲.</Ves>
      ) : (
        <Ves tone="green">Perfecto ✓ D llegó a tiempo y Q copió el 1.</Ves>
      )}
    </SlideFrame>
  );
}

// 2.6 ¿Por qué no infinitos GHz?
export function MaxVelocidad() {
  const [clkq, setClkq] = useState(5);
  const [logic, setLogic] = useState(10);
  const [setup, setSetup] = useState(5);
  const total = clkq + logic + setup;
  const f = maxFreqHz(clkq, logic, setup);
  return (
    <SlideFrame emoji="🏎️" title="¿Por qué no infinitos GHz?" text="El camino más lento manda.">
      <div className="flex items-center justify-between gap-2 text-center text-sm font-bold">
        <span className="rounded-xl bg-navy text-white px-3 py-2">FF 1</span>
        <span className="flex-1 h-1 rounded bg-azul" />
        <span className="rounded-xl bg-naranja text-white px-3 py-2">Lógica</span>
        <span className="flex-1 h-1 rounded bg-naranja" />
        <span className="rounded-xl bg-verde text-white px-3 py-2">FF 2</span>
      </div>
      <Card>
        <TimingDiagram
          from={-total * 0.1}
          to={total * 1.6}
          signals={[{ kind: 'clock', name: 'CLK', period: total, marks: true }]}
          regions={[
            { from: 0, to: clkq, color: '#2E5C8A', label: 'sale', opacity: 0.25 },
            { from: clkq, to: clkq + logic, color: '#D35400', label: 'lógica', opacity: 0.25 },
            { from: clkq + logic, to: total, color: '#1E8449', label: 'llega', opacity: 0.25 },
          ]}
        />
      </Card>
      <Slider label="Sale del flip-flop" min={1} max={10} value={clkq} onChange={setClkq} display={`${clkq} ns`} />
      <Slider label="Pasa por la lógica" min={1} max={40} value={logic} onChange={setLogic} display={`${logic} ns`} accent="#D35400" />
      <Slider label="Llega al siguiente" min={1} max={10} value={setup} onChange={setSetup} display={`${setup} ns`} accent="#1E8449" />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Camino total" value={`${total} ns`} />
        <Stat label="Velocidad máxima" value={fmtFreq(f)} tone="orange" />
      </div>
      <Ves>
        ¿Ves? Camino de {total} ns → velocidad máxima: {fmtFreq(f)}
      </Ves>
    </SlideFrame>
  );
}
