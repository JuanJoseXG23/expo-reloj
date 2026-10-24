import { useEffect, useMemo, useRef, useState } from 'react';
import { TimingDiagram } from '../../components/timing/TimingDiagram';
import { Btn, Card, SlideFrame, Slider, Stat, Toggle, Ves } from '../../components/ui';
import { playTick, useAnimTime } from '../../hooks/useAnimTime';
import { cpuFreqFromCrystal, freqToSlider, sliderToFreq, tickSeconds } from '../../lib/calc';
import { fmtCount, fmtFreq, fmtNum, fmtTime } from '../../lib/format';

// 1.1 El reloj es un metrónomo
export function Metronomo() {
  const [tempo, setTempo] = useState(1);
  const [sound, setSound] = useState(false);
  const [t] = useAnimTime(true, tempo);
  const [flash, setFlash] = useState(false);
  const tics = Math.floor(t);
  const last = useRef(tics);

  useEffect(() => {
    if (tics === last.current) return;
    last.current = tics;
    setFlash(true);
    if (sound) playTick();
    const id = window.setTimeout(() => setFlash(false), 180);
    return () => window.clearTimeout(id);
  }, [tics, sound]);

  return (
    <SlideFrame emoji="⏱️" title="El reloj es un metrónomo" text="El reloj marca el ritmo. Todo el circuito se mueve a ese ritmo.">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <TimingDiagram
              from={t - 5}
              to={t}
              cursor={t}
              rowHeight={70}
              signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]}
            />
          </div>
          <div
            className={`h-14 w-14 shrink-0 rounded-full transition-all duration-150 ${
              flash ? 'bg-naranja scale-110 shadow-[0_0_24px_#D35400]' : 'bg-slate-200'
            }`}
            aria-label="Punto que parpadea en cada subida"
          />
        </div>
      </Card>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
        <Slider label="Ritmo" min={0.5} max={4} step={0.5} value={tempo} onChange={setTempo} display={`${fmtNum(tempo)} tics/s`} />
        <Toggle checked={sound} onChange={setSound} label="🔊 Sonido tic" />
      </div>
      <Ves>Tics contados: {tics} ▲</Ves>
    </SlideFrame>
  );
}

// 1.2 Juega con el reloj
export function JuegaReloj() {
  const [pos, setPos] = useState(Math.round(freqToSlider(5e6) * 1000));
  const [duty, setDuty] = useState(33);
  const freq = sliderToFreq(pos / 1000);
  const cycles = 2 + Math.round((pos / 1000) * 6);
  const preset = (f: number, d: number) => {
    setPos(Math.round(freqToSlider(f) * 1000));
    setDuty(d);
  };
  return (
    <SlideFrame emoji="🎛️" title="Juega con el reloj">
      <Card>
        <TimingDiagram
          from={0}
          to={cycles}
          rowHeight={74}
          signals={[{ kind: 'clock', name: 'CLK', period: 1, duty: duty / 100, marks: true }]}
          regions={[{ from: 0, to: duty / 100, color: '#D35400', label: 'alto', opacity: 0.18 }]}
        />
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Tics por segundo" value={fmtCount(freq)} />
        <Stat label="Cada tic dura" value={fmtTime(tickSeconds(freq))} tone="orange" />
        <Stat label="Tiempo en alto" value={`${duty} %`} />
      </div>
      <Slider label="Velocidad" min={0} max={1000} value={pos} onChange={setPos} display={fmtFreq(freq)} />
      <Slider label="Tiempo en alto" min={10} max={90} value={duty} onChange={setDuty} display={`${duty} %`} accent="#D35400" />
      <div className="flex flex-wrap gap-2">
        <Btn variant="secondary" onClick={() => preset(5e6, 33)}>
          🖥️ 8086 (5 MHz)
        </Btn>
        <Btn variant="secondary" onClick={() => preset(3e9, 50)}>
          📱 Celular/PC actual (3 GHz)
        </Btn>
      </div>
      <Ves>
        ¿Ves? {fmtFreq(freq)} → cada tic dura {fmtTime(tickSeconds(freq))}
      </Ves>
    </SlideFrame>
  );
}

// 1.3 ¿Sube o baja?
interface Round {
  duty: number;
  phase: number;
  edge: number;
  rising: boolean;
}

function newRound(): Round {
  const duty = 0.3 + Math.random() * 0.4;
  const phase = 0.2 + Math.random() * 0.4;
  const k = 1 + Math.floor(Math.random() * 2);
  const rising = Math.random() < 0.5;
  return { duty, phase, rising, edge: phase + k + (rising ? 0 : duty) };
}

const ROUNDS = 5;

export function SubeBaja() {
  const [round, setRound] = useState(newRound);
  const [n, setN] = useState(1);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const done = n > ROUNDS;

  const pick = (rising: boolean) => {
    if (answer !== null) return;
    setAnswer(rising);
    if (rising === round.rising) setScore((s) => s + 1);
  };
  const next = () => {
    setAnswer(null);
    setRound(newRound());
    setN((v) => v + 1);
  };
  const restart = () => {
    setScore(0);
    setN(1);
    setAnswer(null);
    setRound(newRound());
  };
  const ok = answer !== null && answer === round.rising;

  if (done) {
    return (
      <SlideFrame emoji="🏁" title="¿Sube o baja?">
        <div className="rounded-3xl bg-navy text-white p-8 text-center">
          <div className="text-6xl font-extrabold">
            {score}/{ROUNDS}
          </div>
          <div className="mt-2 text-xl font-bold">{score === ROUNDS ? '¡Perfecto! 🎉' : score >= 3 ? '¡Bien hecho!' : '¡Otra vez!'}</div>
        </div>
        <Btn big onClick={restart}>
          Jugar otra vez
        </Btn>
      </SlideFrame>
    );
  }

  return (
    <SlideFrame emoji="🎮" title="¿Sube o baja?" text="Mira el flanco marcado y elige.">
      <div className="flex justify-between font-bold text-navy">
        <span>
          Ronda {n}/{ROUNDS}
        </span>
        <span>⭐ {score}</span>
      </div>
      <Card>
        <TimingDiagram
          from={0}
          to={4}
          rowHeight={80}
          signals={[{ kind: 'clock', name: 'CLK', period: 1, duty: round.duty, phase: round.phase }]}
          regions={[{ from: round.edge - 0.12, to: round.edge + 0.12, color: '#D35400', opacity: 0.3 }]}
          markers={[{ t: round.edge, label: '¿?', color: '#D35400' }]}
        />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Btn big variant={answer === true ? (ok ? 'success' : 'danger') : 'primary'} onClick={() => pick(true)}>
          Sube ↑
        </Btn>
        <Btn big variant={answer === false ? (ok ? 'success' : 'danger') : 'primary'} onClick={() => pick(false)}>
          Baja ↓
        </Btn>
      </div>
      {answer !== null && (
        <>
          <Ves tone={ok ? 'green' : 'red'}>
            {ok ? '¡Correcto! ✓' : `No: este flanco ${round.rising ? 'sube ↑' : 'baja ↓'}.`}
          </Ves>
          <Btn variant="accent" onClick={next}>
            {n === ROUNDS ? 'Ver puntaje' : 'Siguiente →'}
          </Btn>
        </>
      )}
    </SlideFrame>
  );
}

// 1.4 ¿De dónde sale el reloj?
export function Origen() {
  const [crystal, setCrystal] = useState(15);
  const cpu = cpuFreqFromCrystal(crystal * 1e6);
  return (
    <SlideFrame emoji="💎" title="¿De dónde sale el reloj?" text="Un cristal de cuarzo vibra; el chip 8284A lo divide entre 3.">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 sm:gap-2 text-center">
        <Box icon="💎" title="Cristal" value={fmtFreq(crystal * 1e6)} />
        <Wire />
        <Box icon="🔲" title="8284A" value="÷ 3" accent />
        <Wire />
        <Box icon="🧠" title="8086" value={fmtFreq(cpu)} />
      </div>
      <Card>
        <TimingDiagram
          from={0}
          to={9}
          signals={[
            { kind: 'clock', name: 'XTAL', period: 1, duty: 0.5, color: '#7F8C9A' },
            { kind: 'clock', name: 'CLK', period: 3, duty: 1 / 3, marks: true },
          ]}
        />
      </Card>
      <Slider label="Cristal" min={6} max={30} step={0.5} value={crystal} onChange={setCrystal} display={fmtFreq(crystal * 1e6)} />
      <Ves>
        {fmtFreq(crystal * 1e6)} ÷ 3 → el 8086 recibe {fmtFreq(cpu)}
      </Ves>
    </SlideFrame>
  );
}

function Box({ icon, title, value, accent }: { icon: string; title: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-2 sm:p-3 ring-1 ${accent ? 'bg-naranja text-white ring-naranja' : 'bg-white text-navy ring-slate-200'}`}>
      <div className="text-2xl sm:text-3xl">{icon}</div>
      <div className="text-xs sm:text-sm font-bold opacity-80">{title}</div>
      <div className="text-sm sm:text-lg font-extrabold leading-tight">{value}</div>
    </div>
  );
}

function Wire() {
  return (
    <div className="pulse-track h-3 w-6 sm:w-12 rounded-full bg-slate-200">
      <span />
    </div>
  );
}

// 1.5 Más rápido = cada tic más corto
const CPUS = [
  { id: '8086', label: '8086 (1978)', freq: 5e6 },
  { id: '386', label: '386 (1985)', freq: 33e6 },
  { id: 'p1', label: 'Pentium (1995)', freq: 100e6 },
  { id: 'now', label: 'Actual (hoy)', freq: 3e9 },
];

export function Comparacion() {
  const [shown, setShown] = useState<string[]>(['8086', 'now']);
  const [zoom, setZoom] = useState(1);
  const max = tickSeconds(5e6);
  const list = useMemo(() => CPUS.filter((c) => shown.includes(c.id)), [shown]);
  const toggle = (id: string) => setShown((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <SlideFrame emoji="⚡" title="Más rápido = tic más corto" text="Cada barra es lo que dura UN tic.">
      <Card className="space-y-3">
        {list.map((c) => {
          const w = Math.min(100, (tickSeconds(c.freq) / max) * 100 * zoom);
          return (
            <div key={c.id}>
              <div className="flex justify-between text-sm font-bold text-navy">
                <span>{c.label}</span>
                <span className="text-naranja">{fmtTime(tickSeconds(c.freq), 2)}</span>
              </div>
              <div className="h-8 rounded-xl bg-fondo overflow-hidden">
                <div
                  className="bar-grow h-full rounded-xl bg-gradient-to-r from-navy to-azul"
                  style={{ width: `${Math.max(w, 0.4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </Card>
      <div className="flex flex-wrap gap-2">
        {CPUS.map((c) => (
          <Btn key={c.id} variant={shown.includes(c.id) ? 'primary' : 'secondary'} onClick={() => toggle(c.id)}>
            {c.label.split(' ')[0]}
          </Btn>
        ))}
        <Btn variant={zoom > 1 ? 'accent' : 'secondary'} onClick={() => setZoom(zoom > 1 ? 1 : 100)}>
          🔍 Lupa ×100
        </Btn>
      </div>
      <Ves>¿Ves? En lo que el 8086 da 1 tic, uno actual da ~600.</Ves>
    </SlideFrame>
  );
}
