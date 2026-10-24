import { useState } from 'react';
import { TimingDiagram, type Phase } from '../../components/timing/TimingDiagram';
import type { SignalDef } from '../../components/timing/wave';
import { ResultBars } from '../../components/quiz';
import { Btn, Card, Segmented, SlideFrame, Slider, Stat, Toggle, Ves } from '../../components/ui';
import { useAnimTime } from '../../hooks/useAnimTime';
import { useCounts, useQuizAnswers } from '../../hooks/useQuiz';
import { getQuiz } from '../../content/quizzes';
import {
  busCycleSeconds,
  busCycleTics,
  delayLoopCycles,
  delayLoopSeconds,
  INSTRUCTIONS_8086,
  instructionsPerSecond,
  programCycles,
  tickSeconds,
} from '../../lib/calc';
import { fmtCount, fmtInt, fmtTime } from '../../lib/format';
import { useSlide } from '../SlideContext';

const F_8086 = 5e6;

// 3.1 Tics, ciclos e instrucciones
const TICS_PER_INSTR = 12; // ej.: una instrucción que usa 3 ciclos de bus

export function TicsCiclos() {
  const [running, setRunning] = useState(true);
  const [t, setT] = useAnimTime(running, 2.5);
  const tics = Math.min(TICS_PER_INSTR, Math.floor(t % (TICS_PER_INSTR + 4)));
  const cycles = Math.floor(tics / 4);
  return (
    <SlideFrame emoji="🧱" title="Tics, ciclos e instrucciones" text="Cada instrucción cuesta tics.">
      <Card>
        <TimingDiagram
          from={0}
          to={TICS_PER_INSTR}
          revealUntil={tics}
          rowHeight={56}
          signals={[{ kind: 'clock', name: 'CLK', period: 1, duty: 1 / 3, marks: true }]}
          phases={[0, 1, 2].map((k) => ({ from: k * 4, to: k * 4 + 4, label: `Ciclo ${k + 1}`, color: k < cycles ? '#D35400' : '#9FB3C8' }))}
        />
      </Card>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((c) => (
          <div key={c} className={`rounded-2xl p-2 ring-2 transition ${c < cycles ? 'ring-naranja bg-naranja/10' : 'ring-slate-200 bg-white'}`}>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((k) => {
                const on = c * 4 + k < tics;
                return <div key={k} className={`aspect-square rounded-lg transition ${on ? 'bg-azul scale-100' : 'bg-slate-200 scale-90'}`} />;
              })}
            </div>
            <div className="mt-1 text-center text-xs sm:text-sm font-bold text-navy">{c < cycles ? 'Ciclo de bus ✓' : '4 tics'}</div>
          </div>
        ))}
      </div>
      <div
        className={`rounded-2xl p-3 text-center text-xl font-extrabold transition ${
          tics >= TICS_PER_INSTR ? 'bg-verde text-white scale-105' : 'bg-white text-slate-400 ring-1 ring-slate-200'
        }`}
      >
        {tics >= TICS_PER_INSTR ? '1 instrucción ✓' : `Tic ${tics}…`}
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={() => setRunning(!running)}>
          {running ? '⏸ Pausa' : '▶ Seguir'}
        </Btn>
        <Btn variant="secondary" onClick={() => setT(0)}>
          ↺ Otra vez
        </Btn>
      </div>
      <Ves>¿Ves? 1 tic → 4 tics = 1 ciclo de bus → varios ciclos = 1 instrucción.</Ves>
    </SlideFrame>
  );
}

// Señales de una lectura de memoria del 8086 con `w` tics de espera.
function readCycle(w: number): { signals: SignalDef[]; phases: Phase[] } {
  const end = 4 + w;
  const signals: SignalDef[] = [
    { kind: 'clock', name: 'CLK', period: 1, duty: 1 / 3, marks: true },
    { kind: 'digital', name: 'ALE', events: [{ t: 0.1, v: 1 }, { t: 0.75, v: 0 }], initial: 0 },
    {
      kind: 'bus',
      name: 'AD',
      segments: [
        { t: 0.1, label: 'Dirección' },
        { t: 1.05, label: null },
        { t: 2.3 + w, label: 'Dato' },
        { t: end - 0.1, label: null },
      ],
    },
    { kind: 'digital', name: 'RD', activeLow: true, events: [{ t: 1.2, v: 0 }, { t: end - 0.2, v: 1 }], initial: 1 },
    {
      kind: 'digital',
      name: 'READY',
      events: w ? [{ t: 1.6, v: 0 }, { t: 2.5 + w, v: 1 }] : [],
      initial: 1,
      color: w ? '#D35400' : undefined,
    },
  ];
  const phases: Phase[] = [
    { from: 0, to: 1, label: 'T1' },
    { from: 1, to: 2, label: 'T2' },
    { from: 2, to: 3, label: 'T3' },
    ...Array.from({ length: w }, (_, i) => ({ from: 3 + i, to: 4 + i, label: 'Tw', color: '#D35400' })),
    { from: 3 + w, to: 4 + w, label: 'T4' },
  ];
  return { signals, phases };
}

// 3.2 El 8086 leyendo memoria
const STEPS = ['', 'T1: Manda la dirección.', 'T2: Pide leer.', 'T3: Llega el dato…', 'T4: …y lo recoge.'];

export function LecturaMemoria() {
  const [step, setStep] = useState(0);
  const { signals, phases } = readCycle(0);
  const done = step >= 4;
  return (
    <SlideFrame emoji="📖" title="El 8086 leyendo memoria" text="Avanza tic por tic.">
      <Card>
        <TimingDiagram
          from={0}
          to={4}
          signals={signals}
          phases={phases.slice(0, Math.max(step, 0))}
          revealUntil={step}
          regions={step > 0 && !done ? [{ from: step - 1, to: step, color: '#D35400', opacity: 0.12 }] : []}
        />
      </Card>
      <div className="flex gap-2">
        <Btn big className="flex-1" disabled={done} onClick={() => setStep((s) => s + 1)}>
          {step === 0 ? '▶ Empezar' : 'Siguiente paso →'}
        </Btn>
        <Btn variant="secondary" onClick={() => setStep(0)}>
          ↺
        </Btn>
      </div>
      {step > 0 && <Ves tone={done ? 'green' : 'blue'}>{STEPS[step]}</Ves>}
      {done && (
        <Ves tone="orange">
          ¿Ves? 4 tics = {fmtTime(busCycleSeconds(F_8086, 0))} a 5 MHz.
        </Ves>
      )}
    </SlideFrame>
  );
}

// 3.3 Memoria lenta
export function MemoriaLenta() {
  const [waits, setWaits] = useState(0);
  const slow = waits > 0;
  const { signals, phases } = readCycle(waits);
  return (
    <SlideFrame emoji="🐢" title="Memoria lenta" text="Si la memoria no está lista, el 8086 espera tics extra (Tw).">
      <Card>
        <TimingDiagram
          from={0}
          to={7}
          signals={signals}
          phases={phases}
          regions={waits ? [{ from: 3, to: 3 + waits, color: '#D35400', label: 'espera', opacity: 0.22 }] : []}
        />
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle checked={slow} onChange={(v) => setWaits(v ? 1 : 0)} label="Memoria lenta 🐢" />
        <Segmented
          value={waits}
          onChange={setWaits}
          options={[0, 1, 2, 3].map((n) => ({ value: n, label: `${n} Tw` }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Tics" value={busCycleTics(waits)} tone={slow ? 'orange' : 'navy'} />
        <Stat label="Tiempo (5 MHz)" value={fmtTime(busCycleSeconds(F_8086, waits))} tone={slow ? 'orange' : 'navy'} />
      </div>
      <Ves tone={slow ? 'orange' : 'blue'}>
        {slow
          ? `¿Ves? ${waits} tic${waits > 1 ? 's' : ''} de espera → la lectura sube a ${fmtTime(busCycleSeconds(F_8086, waits))}.`
          : 'Sin espera: 4 tics = 800 ns. Activa la memoria lenta 👆'}
      </Ves>
    </SlideFrame>
  );
}

// 3.4 Arma tu programa
const MAX_CYCLES = 144;

export function ArmaPrograma() {
  const [prog, setProg] = useState<string[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const total = prog.length ? programCycles(prog) : 0;
  const add = (id: string) => {
    if (prog.length >= 12) return;
    setProg((p) => [...p, id]);
    setLast(id);
  };
  const lastIns = INSTRUCTIONS_8086.find((i) => i.id === last);
  const ratio = lastIns ? Math.round(lastIns.cycles / 2 / 10) * 10 : 0;
  return (
    <SlideFrame emoji="🧩" title="Arma tu programa" text="Toca instrucciones y mira cuántos tics cuestan.">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {INSTRUCTIONS_8086.map((i) => (
          <button
            key={i.id}
            onClick={() => add(i.id)}
            className={`rounded-2xl px-2 py-3 font-mono font-bold ring-2 transition active:scale-90 ${
              i.cycles > 100 ? 'bg-naranja text-white ring-naranja' : 'bg-white text-navy ring-slate-200'
            }`}
          >
            <div className="text-lg leading-none">{i.label}</div>
            <div className="text-[11px] mt-1 opacity-80">{i.cycles} tics</div>
          </button>
        ))}
      </div>
      <Card className="space-y-1 min-h-[120px]">
        {prog.length === 0 && <div className="text-center text-slate-400 font-semibold py-8">Tu programa está vacío</div>}
        {prog.map((id, k) => {
          const ins = INSTRUCTIONS_8086.find((i) => i.id === id)!;
          return (
            <div key={k} className="flex items-center gap-2 animate-pop">
              <span className="w-28 shrink-0 font-mono text-sm font-bold text-navy truncate">{ins.example}</span>
              <div
                className={`h-6 rounded-lg ${ins.cycles > 100 ? 'bg-naranja' : 'bg-azul'}`}
                style={{ width: `${Math.max(3, (ins.cycles / MAX_CYCLES) * 100)}%` }}
              />
              <span className="text-xs font-bold text-slate-500">{ins.cycles}</span>
            </div>
          );
        })}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Tics totales" value={fmtInt(total)} />
        <Stat label="Tiempo (5 MHz)" value={total ? fmtTime(total * tickSeconds(F_8086)) : '0 s'} tone="orange" />
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" disabled={!prog.length} onClick={() => setProg((p) => p.slice(0, -1))}>
          ↶ Quitar
        </Btn>
        <Btn variant="secondary" disabled={!prog.length} onClick={() => (setProg([]), setLast(null))}>
          🗑 Vaciar
        </Btn>
      </div>
      {lastIns && lastIns.cycles > 100 && (
        <Ves tone="orange">
          ¡{lastIns.label} cuesta ~{ratio} veces más que MOV!
        </Ves>
      )}
      {lastIns && lastIns.cycles <= 100 && <Ves>¿Ves? {lastIns.label} cuesta solo {lastIns.cycles} tics.</Ves>}
    </SlideFrame>
  );
}

// 3.5 Haz una pausa con código
const N_MAX = 65535;

function posToN(pos: number) {
  const raw = Math.max(1, Math.round(Math.pow(10, (pos / 1000) * Math.log10(N_MAX))));
  if (raw < 100) return raw;
  // 2 cifras significativas para que salgan números redondos (1.000, 5.000…)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.min(N_MAX, Math.round(raw / mag) * mag);
}
function nToPos(n: number) {
  return Math.round((Math.log10(n) / Math.log10(N_MAX)) * 1000);
}

export function PausaCodigo() {
  const [pos, setPos] = useState(nToPos(1000));
  const [how, setHow] = useState(false);
  const [t] = useAnimTime(true, 3);
  const n = posToN(pos);
  const cycles = delayLoopCycles(n);
  const time = delayLoopSeconds(n, F_8086);
  const line = 2 + (Math.floor(t) % 2); // alterna NOP ↔ LOOP
  const code = [`        MOV  CX, ${n}`, 'RETARDO:', '        NOP', '        LOOP RETARDO'];
  return (
    <SlideFrame emoji="⏳" title="Haz una pausa con código" text="Un bucle que no hace nada… sirve para esperar.">
      <pre className="rounded-3xl bg-navy p-4 text-base sm:text-lg font-mono text-white overflow-x-auto">
        {code.map((c, i) => (
          <div key={i} className={`rounded px-1 transition ${i === line ? 'bg-naranja' : ''}`}>
            {c}
          </div>
        ))}
      </pre>
      <Slider label="Vueltas (CX)" min={0} max={1000} value={pos} onChange={setPos} display={fmtInt(n)} accent="#D35400" />
      <div className="flex flex-wrap gap-2">
        {[10, 1000, 50000].map((v) => (
          <Btn key={v} variant="secondary" onClick={() => setPos(nToPos(v))}>
            {fmtInt(v)}
          </Btn>
        ))}
      </div>
      <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 text-center">
        <div className="text-sm font-bold text-slate-500">Pausa de</div>
        <div className="text-5xl font-extrabold text-naranja">≈ {fmtTime(time, 2)}</div>
      </div>
      <Btn variant="ghost" onClick={() => setHow(!how)}>
        {how ? '▲ Ocultar' : '¿Cómo se calcula?'}
      </Btn>
      {how && (
        <Card className="font-mono text-sm sm:text-base text-navy space-y-1 animate-pop">
          <div>
            4 + 3×{fmtInt(n)} + 17×{fmtInt(n - 1)} + 5 = <b>{fmtInt(cycles)} tics</b>
          </div>
          <div>
            {fmtInt(cycles)} × 200 ns = <b>{fmtTime(time, 4)}</b>
          </div>
        </Card>
      )}
    </SlideFrame>
  );
}

// 3.6 Respuesta a la pregunta gancho
const HOOK_OPTIONS = [
  { id: 'mul', label: 'MUL 8086', tpi: 118 },
  { id: 'mov', label: 'MOV 8086', tpi: 2 },
  { id: 'one', label: '1 por tic', tpi: 1 },
  { id: 'modern', label: 'Moderno', tpi: 0.25 },
];

export function RespuestaGancho() {
  const { session } = useSlide();
  const revealed = session.activeQuizId === 'gancho' && session.quizState === 'results';
  const answers = useQuizAnswers('gancho', revealed);
  const counts = useCounts(answers, 'gancho');
  const quiz = getQuiz('gancho')!;
  const [opt, setOpt] = useState('mul');
  const sel = HOOK_OPTIONS.find((o) => o.id === opt)!;
  const ips = instructionsPerSecond(3e9, sel.tpi);
  return (
    <SlideFrame
      emoji="💡"
      title="¿3 GHz = 3.000 millones de instrucciones?"
      text="Depende: unas instrucciones gastan muchos tics y los procesadores modernos hacen varias por tic."
    >
      {revealed ? (
        <Card>
          <ResultBars quiz={{ ...quiz, correct: 2 }} counts={counts} />
        </Card>
      ) : (
        <Ves>Los resultados de la votación aparecerán aquí 🔒</Ves>
      )}
      <div className="text-sm font-bold text-navy">A 3 GHz, si cada instrucción es…</div>
      <Segmented value={opt} onChange={setOpt} options={HOOK_OPTIONS.map((o) => ({ value: o.id, label: o.label }))} />
      <div className="rounded-3xl bg-navy text-white p-5 text-center">
        <div className="text-4xl font-extrabold text-naranja">{fmtCount(ips)}</div>
        <div className="font-semibold">instrucciones por segundo</div>
      </div>
      <Ves tone={sel.tpi === 1 ? 'blue' : 'orange'}>
        {sel.tpi === 1 ? 'Solo así serían 3.000 millones exactos.' : '¿Ves? No es 3.000 millones: ¡depende!'}
      </Ves>
    </SlideFrame>
  );
}
