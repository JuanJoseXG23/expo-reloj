// Diapositivas del video beam: una por cada pantalla interactiva (mismo id que en content/blocks.ts).
// El celular es para tocar; la diapositiva es para explicar.
import { Fragment, type ComponentType, type ReactNode } from 'react';
import { TimingDiagram } from '../components/timing/TimingDiagram';
import type { DigitalEvent, SignalDef } from '../components/timing/wave';
import { ResultBars } from '../components/quiz';
import { JoinQr } from '../components/Qr';
import { getQuiz, quizzesOfBlock } from '../content/quizzes';
import { COURSE, PROFESSOR, SCHOOL, TEAM, TOPIC } from '../content/people';
import { useAnimTime } from '../hooks/useAnimTime';
import { useCounts, useQuizAnswers } from '../hooks/useQuiz';
import { delayLoopCycles, INSTRUCTIONS_8086 } from '../lib/calc';
import { fmtInt } from '../lib/format';
import { Cols, DeckSlide, Formula, Hl, Panel, Points, useDeck } from './kit';

const BIG = 520; // unidades máximas de los diagramas: letra más grande en el video beam

function Wave({ children }: { children: ReactNode }) {
  return <Panel className="p-5">{children}</Panel>;
}

// ─────────────────────────── Bloque 0 ───────────────────────────

function D01() {
  const [t] = useAnimTime(true, 0.8);
  return (
    <div className="absolute inset-0 grid grid-cols-[1.45fr_1fr] items-center gap-12 px-20 animate-pop">
      <div className="space-y-6">
        <div className="text-[24px] font-bold leading-snug text-azul">
          {COURSE}
          <br />
          {SCHOOL}
        </div>
        <h1 className="text-[76px] font-extrabold leading-[1.04] text-navy">
          Señales de reloj <Hl>y</Hl> diagramas de tiempo
        </h1>
        <div className="text-[28px] font-semibold text-slate-600">Con el Intel 8086 como protagonista</div>
        <div className="space-y-2 text-[30px] font-bold text-navy">
          {TEAM.map((p) => (
            <div key={p.short}>{p.full}</div>
          ))}
        </div>
        <div className="text-[24px] font-semibold text-slate-500">Docente: {PROFESSOR}</div>
      </div>
      <Wave>
        <TimingDiagram from={t} to={t + 5} rowHeight={90} maxUnits={460} hideLabels signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]} />
      </Wave>
    </div>
  );
}

function D02() {
  return (
    <DeckSlide title="Una pregunta para empezar" phone="Vota: Sí · No · Depende">
      <div className="flex h-full flex-col items-center justify-center gap-8 rounded-[36px] bg-navy px-16 text-center text-white">
        <div className="text-[140px] font-extrabold leading-none text-naranja">3 GHz</div>
        <div className="text-[52px] font-bold leading-tight">
          ¿Hace exactamente <Hl>3.000 millones</Hl> de instrucciones por segundo?
        </div>
        <div className="text-[28px] font-semibold opacity-80">La respuesta llega al final del bloque 3 🔒</div>
      </div>
    </DeckSlide>
  );
}

function D03() {
  return (
    <DeckSlide title="¿Quién le dice al flip-flop cuándo cambiar?" phone="Cambia D y luego toca ▲ Tic del reloj">
      <Cols left="1fr" right="1.1fr">
        <Points
          items={[
            <>Un flip-flop <b>guarda un bit</b>: un 0 o un 1.</>,
            <>Si cambias su entrada <b>D</b>, la salida <b>Q</b> no se mueve sola.</>,
            <>Q solo cambia cuando llega la orden: <Hl>el tic del reloj ▲</Hl>.</>,
          ]}
        />
        <Wave>
          <TimingDiagram
            from={0}
            to={6}
            maxUnits={BIG}
            rowHeight={80}
            signals={[
              { kind: 'clock', name: 'CLK', period: 2, phase: 1, marks: true },
              { kind: 'digital', name: 'D', events: [{ t: 1.6, v: 1 }], color: '#D35400' },
              { kind: 'digital', name: 'Q', events: [{ t: 3.05, v: 1 }], color: '#1E8449' },
            ]}
            markers={[{ t: 3, label: '¡ahora!', color: '#1E8449' }]}
          />
        </Wave>
      </Cols>
    </DeckSlide>
  );
}

function D04() {
  const stops = [
    { icon: '⏱️', title: 'El reloj', who: TEAM[0].full, time: '1:30 – 6:30' },
    { icon: '📈', title: 'Diagramas de tiempo', who: TEAM[1].full, time: '6:30 – 12:30' },
    { icon: '💻', title: 'El reloj en ensamblador', who: TEAM[2].full, time: '12:30 – 18:30' },
  ];
  return (
    <DeckSlide title="Lo que veremos hoy">
      <div className="grid h-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-6">
        {stops.map((s, i) => (
          <Fragment key={s.title}>
            <Panel className="flex h-[420px] flex-col items-center justify-center gap-4 text-center">
              <div className="text-[96px]">{s.icon}</div>
              <div className="text-[40px] font-extrabold leading-tight text-navy">{s.title}</div>
              <div className="text-[24px] font-semibold text-slate-500">{s.who}</div>
              <div className="font-mono text-[22px] font-bold text-naranja">{s.time}</div>
            </Panel>
            {i < stops.length - 1 && <span className="text-[64px] font-extrabold text-naranja">→</span>}
          </Fragment>
        ))}
      </div>
    </DeckSlide>
  );
}

// ─────────────────────────── Bloque 1 ───────────────────────────

function D11() {
  const [t] = useAnimTime(true, 1);
  return (
    <DeckSlide title="El reloj es un metrónomo" phone="Activa el sonido 🔊 y cambia el ritmo">
      <Cols left="1fr" right="1.15fr">
        <Points
          items={[
            <>Una señal que sube y baja <b>siempre al mismo ritmo</b>.</>,
            <>Arriba = <b>1</b> · abajo = <b>0</b>.</>,
            <>
              La subida <Hl>▲</Hl> se llama <b>flanco de subida</b>: es la orden de “¡ahora!”.
            </>,
            <>Todo el circuito cambia junto en ese instante: es un <b>circuito síncrono</b>.</>,
          ]}
        />
        <Wave>
          <TimingDiagram from={t - 5} to={t} cursor={t} rowHeight={110} maxUnits={BIG} signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]} />
        </Wave>
      </Cols>
    </DeckSlide>
  );
}

function D12() {
  const rows = [
    ['8086', '5 MHz', '200 ns'],
    ['8086-2', '8 MHz', '125 ns'],
    ['PC / celular actual', '3 GHz', '0,33 ns'],
  ];
  return (
    <DeckSlide title="Frecuencia y periodo" phone="Mueve la velocidad y el tiempo en alto">
      <Cols left="1.05fr" right="1fr">
        <div className="space-y-6">
          <Formula small>
            f = tics por segundo
            <br />T = 1 / f (lo que dura un tic)
          </Formula>
          <Panel className="p-0">
            <table className="w-full text-[30px]">
              <thead>
                <tr className="text-left text-[22px] text-slate-500">
                  <th className="px-6 py-3">Procesador</th>
                  <th className="px-6 py-3">Frecuencia</th>
                  <th className="px-6 py-3">Cada tic dura</th>
                </tr>
              </thead>
              <tbody className="font-bold text-navy">
                {rows.map((r) => (
                  <tr key={r[0]} className="border-t border-slate-200">
                    <td className="px-6 py-3">{r[0]}</td>
                    <td className="px-6 py-3 font-mono">{r[1]}</td>
                    <td className="px-6 py-3 font-mono text-naranja">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <div className="text-[30px] font-bold text-navy">
            Truco: <Hl>1000 ÷ MHz = nanosegundos</Hl>
          </div>
        </div>
        <div className="space-y-5">
          <Wave>
            <TimingDiagram
              from={0}
              to={3}
              rowHeight={100}
              maxUnits={BIG}
              signals={[{ kind: 'clock', name: 'CLK', period: 1, duty: 1 / 3, marks: true }]}
              phases={[
                { from: 0, to: 1, label: '1 tic = T' },
                { from: 1, to: 2, label: '1 tic = T' },
                { from: 2, to: 3, label: '1 tic = T' },
              ]}
              regions={[{ from: 0, to: 1 / 3, color: '#D35400', opacity: 0.2 }]}
            />
          </Wave>
          <div className="text-[30px] font-semibold text-navy">
            <b>Tiempo en alto</b>: qué parte del tic vale 1. El 8086 exige <Hl>33 %</Hl>.
          </div>
        </div>
      </Cols>
    </DeckSlide>
  );
}

function D13() {
  return (
    <DeckSlide title="¿Sube o baja?" phone="Juega 5 rondas: ¿el flanco marcado sube o baja?">
      <Cols left="1fr" right="1.15fr">
        <Points
          items={[
            <>
              <Hl>Flanco de subida ▲</Hl>: pasa de 0 a 1.
            </>,
            <>
              <b>Flanco de bajada ▼</b>: pasa de 1 a 0.
            </>,
            <>Casi todos los flip-flops reaccionan al de subida.</>,
          ]}
        />
        <Wave>
          <TimingDiagram
            from={0}
            to={3}
            rowHeight={120}
            maxUnits={BIG}
            signals={[{ kind: 'clock', name: 'CLK', period: 2, phase: 0.5 }]}
            regions={[
              { from: 0.4, to: 0.6, color: '#D35400', label: 'sube ▲', opacity: 0.3 },
              { from: 1.4, to: 1.6, color: '#2E5C8A', label: 'baja ▼', opacity: 0.3 },
            ]}
          />
        </Wave>
      </Cols>
    </DeckSlide>
  );
}

function D14() {
  return (
    <DeckSlide title="¿De dónde sale el reloj?" phone="Mueve el cristal y mira qué recibe el 8086">
      <div className="grid h-full grid-rows-[auto_1fr] gap-7">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-5 text-center">
          <Chip icon="💎" title="Cristal de cuarzo" value="15 MHz" />
          <Arrow />
          <Chip icon="🔲" title="Chip 8284A" value="÷ 3" accent />
          <Arrow />
          <Chip icon="🧠" title="Intel 8086" value="5 MHz · 33 %" />
        </div>
        <Cols left="1.15fr" right="1fr">
          <Wave>
            <TimingDiagram
              from={0}
              to={9}
              rowHeight={80}
              maxUnits={BIG}
              signals={[
                { kind: 'clock', name: 'XTAL', period: 1, color: '#7F8C9A' },
                { kind: 'clock', name: 'CLK', period: 3, duty: 1 / 3, marks: true },
              ]}
            />
          </Wave>
          <Points
            items={[
              <>El cuarzo vibra a una frecuencia <b>muy precisa</b>.</>,
              <>
                Al dividir entre 3 queda <Hl>1/3 en alto</Hl>: el 33 % del 8086.
              </>,
              <>IBM PC: 14,318 MHz ÷ 3 = 4,77 MHz.</>,
            ]}
          />
        </Cols>
      </div>
    </DeckSlide>
  );
}

function Chip({ icon, title, value, accent }: { icon: string; title: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[28px] p-6 ${accent ? 'bg-naranja text-white' : 'bg-white text-navy ring-1 ring-slate-200'}`}>
      <div className="text-[56px] leading-none">{icon}</div>
      <div className="mt-2 text-[26px] font-bold opacity-80">{title}</div>
      <div className="text-[40px] font-extrabold">{value}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="pulse-track h-4 w-24 rounded-full bg-slate-300">
      <span />
    </div>
  );
}

function D15() {
  const bars = [
    { label: '8086 · 1978', ns: 200 },
    { label: '386 · 1985', ns: 30 },
    { label: 'Pentium · 1995', ns: 10 },
    { label: 'Hoy · 3 GHz', ns: 0.33 },
  ];
  return (
    <DeckSlide title="Más rápido = cada tic más corto" phone="Activa la lupa ×100 para ver el tic actual">
      <Cols left="1.3fr" right="1fr">
        <Panel className="space-y-6">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-[28px] font-bold text-navy">
                <span>{b.label}</span>
                <span className="font-mono text-naranja">{String(b.ns).replace('.', ',')} ns</span>
              </div>
              <div className="h-10 overflow-hidden rounded-xl bg-fondo">
                <div className="h-full rounded-xl bg-gradient-to-r from-navy to-azul" style={{ width: `${Math.max(0.5, (b.ns / 200) * 100)}%` }} />
              </div>
            </div>
          ))}
        </Panel>
        <Points
          items={[
            <>
              En 1 tic del 8086 caben <Hl>~600 tics</Hl> de un procesador actual.
            </>,
            <>En 0,33 ns la luz solo avanza unos 10 cm.</>,
          ]}
        />
      </Cols>
    </DeckSlide>
  );
}

// ─────────────────────────── Mini-quiz (bloques 1, 2 y 3) ───────────────────────────

function makeQuizDeck(block: number, title: string) {
  return function QuizDeck() {
    const { session } = useDeck();
    const quizzes = quizzesOfBlock(block);
    const review = session.status === 'ended';
    return (
      <DeckSlide title={`Mini-quiz · ${title}`} phone="Responde en la tarjeta de pregunta">
        <div className="grid h-full content-center gap-5">
          {quizzes.map((q, i) => {
            const done = review || session.doneQuizzes.includes(q.id);
            const answer = q.correct !== null ? q.options[q.correct] : null;
            return (
              <Panel key={q.id} className="flex items-center gap-6">
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-fondo text-[40px] font-extrabold text-azul">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[26px] font-bold text-slate-500">{q.topic}</div>
                  {done ? (
                    <>
                      <div className="text-[32px] font-extrabold text-navy">{q.question}</div>
                      <div className="text-[28px] font-bold text-verde">
                        ✓ {answer?.visual ? 'La que sube ▲' : answer?.text} — <span className="font-semibold text-navy">{q.explain}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[32px] font-extrabold text-slate-400">🔒 Pregunta sorpresa</div>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      </DeckSlide>
    );
  };
}

// ─────────────────────────── Bloque 2 ───────────────────────────

function repeat<T extends { t: number }>(pattern: T[], len: number, from: number, to: number): T[] {
  const out: T[] = [];
  for (let k = Math.floor(from / len) - 1; k * len < to; k++) for (const e of pattern) out.push({ ...e, t: e.t + k * len });
  return out;
}

function D21() {
  const [t] = useAnimTime(true, 1.2);
  const from = t - 8;
  const signals: SignalDef[] = [
    { kind: 'clock', name: 'CLK', period: 1, marks: true },
    { kind: 'digital', name: 'A', events: repeat<DigitalEvent>([{ t: 0, v: 1 }, { t: 2, v: 0 }, { t: 3, v: 1 }, { t: 4, v: 0 }], 6, from, t) },
    { kind: 'digital', name: 'B', events: repeat<DigitalEvent>([{ t: 1, v: 1 }, { t: 3, v: 0 }, { t: 4, v: 1 }, { t: 5, v: 0 }], 6, from, t) },
    { kind: 'bus', name: 'BUS', segments: repeat([{ t: 0, label: '3F' }, { t: 2, label: null }, { t: 3, label: 'A7' }, { t: 5, label: '12' }], 6, from, t) },
  ];
  return (
    <DeckSlide title="¿Qué es un diagrama de tiempo?" phone="Toca cada fila para saber qué es">
      <Cols left="1.35fr" right="1fr">
        <Wave>
          <TimingDiagram from={from} to={t} cursor={t - 2} rowHeight={78} maxUnits={BIG} signals={signals} />
        </Wave>
        <Points
          items={[
            <>Cada <b>fila</b> es un cable.</>,
            <>El tiempo avanza <b>→</b> igual para todas.</>,
            <>
              Se lee <Hl>en vertical</Hl>: qué vale cada cable en el mismo instante.
            </>,
            <>Arriba va el reloj: es la referencia.</>,
          ]}
        />
      </Cols>
    </DeckSlide>
  );
}

function D22() {
  const items: { sig: SignalDef; title: string; text: string; labels?: boolean }[] = [
    { sig: { kind: 'digital', name: 'X', events: [], initial: 1 }, title: 'Arriba', text: 'vale 1' },
    { sig: { kind: 'digital', name: 'X', events: [], initial: 0 }, title: 'Abajo', text: 'vale 0' },
    { sig: { kind: 'bus', name: 'X', segments: [{ t: 0, label: '3F' }, { t: 2, label: 'A7' }] }, title: 'Hexágono', text: 'bus: muchos bits a la vez' },
    { sig: { kind: 'digital', name: 'X', events: [], initial: 'z' }, title: 'A la mitad', text: 'alta impedancia: nadie lo usa' },
    {
      sig: { kind: 'digital', name: 'RD', activeLow: true, events: [{ t: 1, v: 0 }, { t: 3, v: 1 }], initial: 1 },
      title: 'Raya encima',
      text: 'funciona con 0 (activa en bajo)',
      labels: true,
    },
  ];
  return (
    <DeckSlide title="El idioma de los diagramas" phone="Toca cada dibujo para ver qué significa">
      <div className="grid h-full grid-cols-5 items-center gap-5">
        {items.map((it) => (
          <Panel key={it.title} className="flex h-[440px] flex-col justify-center gap-8 p-5 text-center">
            <TimingDiagram from={0} to={4} rowHeight={110} labelWidth={58} hideLabels={!it.labels} signals={[it.sig]} />
            <div>
              <div className="text-[34px] font-extrabold text-navy">{it.title}</div>
              <div className="text-[26px] font-semibold leading-snug text-slate-600">{it.text}</div>
            </div>
          </Panel>
        ))}
      </div>
    </DeckSlide>
  );
}

function D23() {
  return (
    <DeckSlide title="Nada es instantáneo" phone="Cambia A y sube el retardo">
      <Cols left="1.25fr" right="1fr">
        <Wave>
          <TimingDiagram
            from={0}
            to={6}
            rowHeight={100}
            maxUnits={BIG}
            signals={[
              { kind: 'digital', name: 'A', events: [{ t: 1.5, v: 1 }, { t: 4, v: 0 }] },
              { kind: 'digital', name: 'Y', events: [{ t: 2.3, v: 0 }, { t: 4.8, v: 1 }], initial: 1, color: '#D35400' },
            ]}
            regions={[
              { from: 1.5, to: 2.3, color: '#D35400', label: 'retardo' },
              { from: 4, to: 4.8, color: '#D35400', label: 'retardo' },
            ]}
          />
        </Wave>
        <Points
          items={[
            <>NOT: lo que entra, sale al revés.</>,
            <>
              La salida llega <Hl>tarde</Hl>: <b>retardo de propagación</b>.
            </>,
            <>Los transistores tardan en cargarse, como un balde que se llena.</>,
            <>Compuerta clásica (74LS04): ~10 ns. Nunca es cero.</>,
          ]}
        />
      </Cols>
    </DeckSlide>
  );
}

function D24() {
  return (
    <DeckSlide title={<>Flip-flop D: Q copia a D <Hl>solo en ▲</Hl></>} phone="Toca D varias veces y mira cuándo cambia Q">
      <Cols left="1.4fr" right="1fr">
        <Wave>
          <TimingDiagram
            from={0}
            to={7}
            rowHeight={82}
            maxUnits={BIG}
            signals={[
              { kind: 'clock', name: 'CLK', period: 2, marks: true },
              { kind: 'digital', name: 'D', events: [{ t: 0.7, v: 1 }, { t: 2.6, v: 0 }, { t: 3.1, v: 1 }, { t: 5.2, v: 0 }], color: '#D35400' },
              { kind: 'digital', name: 'Q', events: [{ t: 2.05, v: 1 }, { t: 6.05, v: 0 }], color: '#1E8449' },
            ]}
            markers={[
              { t: 2, label: '✓ copia', color: '#1E8449', row: 2 },
              { t: 2.6, label: 'ignorado', color: '#C0392B', row: 1 },
              { t: 6, label: '✓ copia', color: '#1E8449', row: 2 },
            ]}
          />
        </Wave>
        <Points
          items={[
            <>D = dato que entra · Q = lo que guarda.</>,
            <>Lo que pasa entre subidas <b>se ignora</b>.</>,
            <>
              Un registro como <b>AX</b> = <Hl>16 flip-flops</Hl>, uno por bit.
            </>,
          ]}
        />
      </Cols>
    </DeckSlide>
  );
}

function D25() {
  const zone = [{ from: 1.7, to: 2.15, color: '#C0392B', opacity: 0.2 }];
  return (
    <DeckSlide title="Llegaste tarde: metaestabilidad" phone="Arrastra el cambio de D: evita la zona roja">
      <div className="grid h-full grid-cols-2 gap-8">
        <Panel className="space-y-3">
          <div className="text-[32px] font-extrabold text-verde">✓ D cambia antes de la zona roja</div>
          <TimingDiagram
            from={0.5}
            to={3.5}
            rowHeight={80}
            maxUnits={460}
            signals={[
              { kind: 'clock', name: 'CLK', period: 2, marks: true },
              { kind: 'digital', name: 'D', events: [{ t: 1.1, v: 1 }], color: '#D35400' },
              { kind: 'digital', name: 'Q', events: [{ t: 2.1, v: 1 }], color: '#1E8449' },
            ]}
            regions={zone}
          />
        </Panel>
        <Panel className="space-y-3">
          <div className="text-[32px] font-extrabold text-rojo">✗ D cambia en la zona: Q tiembla</div>
          <TimingDiagram
            from={0.5}
            to={3.5}
            rowHeight={80}
            maxUnits={460}
            signals={[
              { kind: 'clock', name: 'CLK', period: 2, marks: true },
              { kind: 'digital', name: 'D', events: [{ t: 1.9, v: 1 }], color: '#D35400' },
              { kind: 'digital', name: 'Q', events: [{ t: 2.1, v: 'x' }, { t: 2.9, v: 1 }], color: '#C0392B' },
            ]}
            regions={zone}
            shakeRows={[2]}
          />
        </Panel>
        <div className="col-span-2 text-[30px] font-semibold text-navy">
          <b>Setup</b>: D quieto <i>antes</i> de ▲ · <b>Hold</b>: D quieto <i>después</i> de ▲ · Si no, el flip-flop queda <Hl>indeciso</Hl> como una moneda de canto.
        </div>
      </div>
    </DeckSlide>
  );
}

function D26() {
  return (
    <DeckSlide title="¿Por qué no infinitos GHz?" phone="Mueve los tres tiempos y mira la velocidad máxima">
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-6">
        <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4 text-[30px] font-extrabold">
          <span className="rounded-2xl bg-navy px-6 py-3 text-white">FF 1</span>
          <span className="h-2 rounded bg-azul" />
          <span className="rounded-2xl bg-naranja px-6 py-3 text-white">Lógica</span>
          <span className="h-2 rounded bg-naranja" />
          <span className="rounded-2xl bg-verde px-6 py-3 text-white">FF 2</span>
        </div>
        <Formula small>
          T ≥ sale del FF + lógica + llega al FF &nbsp;→&nbsp; 5 + 10 + 5 = 20 ns &nbsp;→&nbsp; <Hl>50 MHz</Hl>
        </Formula>
        <Cols left="1.2fr" right="1fr">
          <Wave>
            <TimingDiagram
              from={-2}
              to={32}
              rowHeight={100}
              maxUnits={BIG}
              signals={[{ kind: 'clock', name: 'CLK', period: 20, marks: true }]}
              regions={[
                { from: 0, to: 5, color: '#2E5C8A', label: 'sale', opacity: 0.25 },
                { from: 5, to: 15, color: '#D35400', label: 'lógica', opacity: 0.25 },
                { from: 15, to: 20, color: '#1E8449', label: 'llega', opacity: 0.25 },
              ]}
            />
          </Wave>
          <Points
            items={[
              <>Todo el viaje debe caber en <b>un tic</b>.</>,
              <>
                El camino más lento manda: <Hl>camino crítico</Hl>.
              </>,
            ]}
          />
        </Cols>
      </div>
    </DeckSlide>
  );
}

// ─────────────────────────── Bloque 3 ───────────────────────────

function readCycle(w: number): { signals: SignalDef[]; phases: { from: number; to: number; label: string; color?: string }[] } {
  const end = 4 + w;
  return {
    signals: [
      { kind: 'clock', name: 'CLK', period: 1, duty: 1 / 3, marks: true },
      { kind: 'digital', name: 'ALE', events: [{ t: 0.1, v: 1 }, { t: 0.75, v: 0 }] },
      { kind: 'bus', name: 'AD', segments: [{ t: 0.1, label: 'Dirección' }, { t: 1.05, label: null }, { t: 2.3 + w, label: 'Dato' }, { t: end - 0.1, label: null }] },
      { kind: 'digital', name: 'RD', activeLow: true, events: [{ t: 1.2, v: 0 }, { t: end - 0.2, v: 1 }], initial: 1 },
      { kind: 'digital', name: 'READY', events: w ? [{ t: 1.6, v: 0 }, { t: 2.5 + w, v: 1 }] : [], initial: 1, color: w ? '#D35400' : undefined },
    ],
    phases: [
      { from: 0, to: 1, label: 'T1' },
      { from: 1, to: 2, label: 'T2' },
      { from: 2, to: 3, label: 'T3' },
      ...Array.from({ length: w }, (_, i) => ({ from: 3 + i, to: 4 + i, label: 'Tw', color: '#D35400' })),
      { from: 3 + w, to: 4 + w, label: 'T4' },
    ],
  };
}

function D31() {
  return (
    <DeckSlide title="Tics, ciclos e instrucciones" phone="Mira cómo 4 tics forman un ciclo de bus">
      <div className="grid h-full grid-cols-3 items-center gap-8">
        {[
          { n: '1 tic', sub: 'un periodo del reloj', val: '200 ns', boxes: 1 },
          { n: '1 ciclo de bus', sub: '4 tics: leer o escribir en memoria', val: '800 ns', boxes: 4 },
          { n: '1 instrucción', sub: 'uno o varios ciclos de bus', val: 'varios µs', boxes: 12 },
        ].map((x, i) => (
          <Panel key={x.n} className="flex h-[440px] flex-col items-center justify-center gap-5 text-center">
            <div className="flex max-w-[300px] flex-wrap justify-center gap-2">
              {Array.from({ length: x.boxes }, (_, k) => (
                <span key={k} className={`h-9 w-9 rounded-lg ${i === 2 && k % 4 === 3 ? 'bg-naranja' : 'bg-azul'}`} />
              ))}
            </div>
            <div className="text-[44px] font-extrabold text-navy">{x.n}</div>
            <div className="text-[26px] font-semibold text-slate-600">{x.sub}</div>
            <div className="font-mono text-[30px] font-bold text-naranja">{x.val}</div>
          </Panel>
        ))}
      </div>
    </DeckSlide>
  );
}

const READ_STEPS = [
  <>
    <b>T1</b> · manda la <Hl>dirección</Hl> por AD y ALE avisa “guárdala”.
  </>,
  <>
    <b>T2</b> · suelta el bus (alta impedancia) y baja <span style={{ textDecoration: 'overline' }}>RD</span>: “quiero leer”.
  </>,
  <>
    <b>T3</b> · la memoria pone el <Hl>dato</Hl> en el bus.
  </>,
  <>
    <b>T4</b> · el 8086 ya lo recogió y sube <span style={{ textDecoration: 'overline' }}>RD</span>.
  </>,
];

function D32() {
  const [t] = useAnimTime(true, 0.45);
  const step = Math.floor(t) % 6; // 0 = ciclo completo, 1..4 = T1..T4 paso a paso, 5 = completo
  const shown = step === 0 ? 4 : Math.min(4, step);
  const { signals, phases } = readCycle(0);
  return (
    <DeckSlide title="El 8086 leyendo memoria: 4 tics" phone="Toca “Siguiente paso” y avanza T1 → T4">
      <Cols left="1.25fr" right="1fr">
        <Wave>
          <TimingDiagram
            from={0}
            to={4}
            rowHeight={60}
            maxUnits={BIG}
            signals={signals}
            phases={phases}
            revealUntil={shown}
            regions={step >= 1 && step <= 4 ? [{ from: shown - 1, to: shown, color: '#D35400', opacity: 0.12 }] : []}
          />
        </Wave>
        <div className="space-y-6">
          <Points items={READ_STEPS} active={step >= 1 && step <= 4 ? step - 1 : undefined} />
          <Formula small>4 tics × 200 ns = 800 ns</Formula>
        </div>
      </Cols>
    </DeckSlide>
  );
}

function D33() {
  const { signals, phases } = readCycle(1);
  return (
    <DeckSlide title="Memoria lenta: tics de espera (Tw)" phone="Activa “Memoria lenta 🐢” y prueba 1, 2 y 3 Tw">
      <Cols left="1.3fr" right="1fr">
        <Wave>
          <TimingDiagram
            from={0}
            to={5}
            rowHeight={60}
            maxUnits={BIG}
            signals={signals}
            phases={phases}
            regions={[{ from: 3, to: 4, color: '#D35400', label: 'espera', opacity: 0.22 }]}
          />
        </Wave>
        <div className="space-y-5">
          <div className="text-[30px] font-semibold text-navy">
            Si la memoria no está lista pone <b>READY = 0</b> y el 8086 mete tics <Hl>Tw</Hl> antes de T4.
          </div>
          <Panel className="p-0">
            <table className="w-full text-[30px] font-bold text-navy">
              <tbody>
                {[0, 1, 2, 3].map((w) => (
                  <tr key={w} className={`border-t border-slate-200 first:border-0 ${w === 1 ? 'bg-naranja/10' : ''}`}>
                    <td className="px-6 py-3">{w} Tw</td>
                    <td className="px-6 py-3 font-mono">{4 + w} tics</td>
                    <td className="px-6 py-3 font-mono text-naranja">{['800 ns', '1 µs', '1,2 µs', '1,4 µs'][w]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </Cols>
    </DeckSlide>
  );
}

function D34() {
  return (
    <DeckSlide title="Cada instrucción cuesta tics" phone="Arma tu programa: toca MOV, ADD… y luego MUL">
      <Cols left="1.35fr" right="1fr">
        <Panel className="space-y-3">
          {INSTRUCTIONS_8086.map((i) => (
            <div key={i.id} className="grid grid-cols-[210px_1fr_80px] items-center gap-4">
              <span className="font-mono text-[26px] font-bold text-navy">{i.example}</span>
              <div className="h-8 rounded-lg bg-fondo">
                <div className={`h-full rounded-lg ${i.cycles > 100 ? 'bg-naranja' : 'bg-azul'}`} style={{ width: `${Math.max(2, (i.cycles / 144) * 100)}%` }} />
              </div>
              <span className="text-right font-mono text-[26px] font-bold text-navy">{i.cycles}</span>
            </div>
          ))}
        </Panel>
        <Points
          items={[
            <>Datos del manual de Intel (mejor caso).</>,
            <>
              <Hl>MUL ≈ 60 veces</Hl> un MOV: multiplica bit por bit.
            </>,
            <>Truco de la época: SHL (×2) cuesta solo 2 tics.</>,
          ]}
        />
      </Cols>
    </DeckSlide>
  );
}

function D35() {
  return (
    <DeckSlide title="Una pausa hecha con código" phone="Mueve las vueltas y mira cuánto dura la pausa">
      <Cols left="1fr" right="1.05fr">
        <pre className="rounded-[28px] bg-navy p-8 font-mono text-[34px] leading-relaxed text-white">
          {'        MOV  CX, 1000   ; 4\nRETARDO:\n        NOP             ; 3 × N\n        LOOP RETARDO    ; 17 / 5'}
        </pre>
        <div className="space-y-6">
          <Formula small>4 + 3N + 17(N−1) + 5</Formula>
          <div className="text-[34px] font-bold text-navy">
            N = 1000 → {fmtInt(delayLoopCycles(1000))} tics × 200 ns ≈ <Hl>4 ms</Hl>
          </div>
          <div className="text-[28px] font-semibold text-slate-600">
            Problema: depende del reloj. En un PC más rápido dura menos… por eso existía el botón <b>Turbo</b>.
          </div>
        </div>
      </Cols>
    </DeckSlide>
  );
}

function D36() {
  const { session } = useDeck();
  const revealed = session.status === 'ended' || session.doneQuizzes.includes('gancho') || (session.activeQuizId === 'gancho' && session.quizState === 'results');
  const live = session.activeQuizId === 'gancho' && session.quizState === 'results';
  const answers = useQuizAnswers('gancho', live);
  const counts = useCounts(answers, 'gancho');
  const quiz = getQuiz('gancho')!;
  return (
    <DeckSlide title={<>¿3 GHz = 3.000 millones? <Hl>Depende</Hl></>} phone="Compara MUL, MOV y un procesador moderno">
      <Cols left="1fr" right="1fr">
        <div className="space-y-6">
          <Formula small>instrucciones/s = frecuencia × instrucciones por tic</Formula>
          <Panel className="space-y-3 text-[30px] font-bold text-navy">
            <div className="flex justify-between">
              <span>MUL del 8086 (118 tics)</span>
              <span className="font-mono text-naranja">25 millones</span>
            </div>
            <div className="flex justify-between">
              <span>1 instrucción por tic</span>
              <span className="font-mono text-naranja">3.000 millones</span>
            </div>
            <div className="flex justify-between">
              <span>Moderno (~4 por tic)</span>
              <span className="font-mono text-naranja">12.000 millones</span>
            </div>
          </Panel>
        </div>
        <Panel>
          <div className="mb-4 text-[28px] font-extrabold text-navy">Así votaron al principio</div>
          {revealed && live ? (
            <ResultBars quiz={{ ...quiz, correct: 2 }} counts={counts} big />
          ) : revealed ? (
            <div className="text-[30px] font-semibold text-slate-600">Resultados mostrados ✓</div>
          ) : (
            <div className="text-[30px] font-semibold text-slate-400">🔒 Se revelan desde el panel</div>
          )}
        </Panel>
      </Cols>
    </DeckSlide>
  );
}

// ─────────────────────────── Bloque 4 ───────────────────────────

function D41() {
  const ideas = ['El reloj marca el ritmo de todo.', 'Los diagramas de tiempo nos dejan ver cada tic.', 'En ensamblador, cada instrucción cuesta tics de reloj.'];
  return (
    <DeckSlide title="Tres ideas para llevarse">
      <div className="grid h-full content-center gap-6">
        {TEAM.map((p, i) => (
          <Panel key={p.short} className="flex items-center gap-8">
            <span className="text-[72px]">{['⏱️', '📈', '💻'][i]}</span>
            <div>
              <div className="text-[44px] font-extrabold leading-tight text-navy">{ideas[i]}</div>
              <div className="text-[26px] font-bold text-naranja">{p.full}</div>
            </div>
          </Panel>
        ))}
      </div>
    </DeckSlide>
  );
}

function D42() {
  const { session } = useDeck();
  const done = session.status === 'ended' || session.doneQuizzes.includes('final');
  return (
    <DeckSlide title="Pregunta final" phone="Responde en la tarjeta de pregunta">
      <div className="flex h-full flex-col items-center justify-center gap-8 rounded-[36px] bg-navy px-16 text-center text-white">
        <div className="text-[80px] font-extrabold">
          8086 · <Hl>5 MHz</Hl> + 🐢 1 tic de espera
        </div>
        <div className="text-[52px] font-bold">¿Cuánto tarda la lectura?</div>
        {done && <div className="rounded-3xl bg-verde px-10 py-4 text-[40px] font-extrabold">✓ (4 + 1) × 200 ns = 1 µs</div>}
      </div>
    </DeckSlide>
  );
}

const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

function D43() {
  const { session } = useDeck();
  const top = session.ranking.slice(0, 5);
  return (
    <DeckSlide title="🏆 Top 5">
      {session.showRanking && top.length ? (
        <div className="grid h-full content-center gap-4">
          {top.map((r, i) => (
            <div
              key={`${r.name}${i}`}
              className={`flex items-center gap-8 rounded-[28px] px-10 py-5 animate-pop ${i === 0 ? 'bg-naranja text-white' : 'bg-white text-navy ring-1 ring-slate-200'}`}
              style={{ animationDelay: `${(top.length - i) * 0.25}s` }}
            >
              <span className="w-20 text-center text-[56px] font-extrabold">{MEDALS[i]}</span>
              <span className="flex-1 truncate text-[48px] font-extrabold">{r.name}</span>
              <span className="text-[44px] font-extrabold">{r.points} pts</span>
            </div>
          ))}
        </div>
      ) : session.showRanking ? (
        <div className="grid h-full place-items-center text-center text-[48px] font-extrabold text-slate-400">
          Todavía nadie ha respondido preguntas 🤷
        </div>
      ) : (
        <div className="grid h-full place-items-center text-[60px] font-extrabold text-slate-400">🥁 Muy pronto…</div>
      )}
    </DeckSlide>
  );
}

export function ThanksSlide() {
  return (
    <div className="absolute inset-0 grid grid-cols-[1.3fr_1fr] items-center gap-12 px-20 animate-pop">
      <div className="space-y-6">
        <div className="text-[120px] font-extrabold leading-none text-navy">¡Gracias!</div>
        <div className="text-[34px] font-bold text-azul">{TOPIC}</div>
        <div className="space-y-1 text-[32px] font-bold text-navy">
          {TEAM.map((p) => (
            <div key={p.short}>{p.full}</div>
          ))}
        </div>
        <div className="text-[26px] font-semibold text-slate-500">
          Docente: {PROFESSOR} · {COURSE}
        </div>
        <div className="text-[30px] font-bold text-naranja">¿Preguntas?</div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="text-[30px] font-bold text-navy">📚 Repasa todo desde tu celular</div>
        <JoinQr size={380} />
      </div>
    </div>
  );
}

export const DECK: Record<string, ComponentType> = {
  '0.1': D01,
  '0.2': D02,
  '0.3': D03,
  '0.4': D04,
  '1.1': D11,
  '1.2': D12,
  '1.3': D13,
  '1.4': D14,
  '1.5': D15,
  '1.q': makeQuizDeck(1, 'El reloj'),
  '2.1': D21,
  '2.2': D22,
  '2.3': D23,
  '2.4': D24,
  '2.5': D25,
  '2.6': D26,
  '2.q': makeQuizDeck(2, 'Diagramas de tiempo'),
  '3.1': D31,
  '3.2': D32,
  '3.3': D33,
  '3.4': D34,
  '3.5': D35,
  '3.6': D36,
  '3.q': makeQuizDeck(3, 'El reloj en ensamblador'),
  '4.1': D41,
  '4.2': D42,
  '4.3': D43,
  '4.4': ThanksSlide,
};
