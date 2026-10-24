import { useState } from 'react';
import { TimingDiagram } from '../../components/timing/TimingDiagram';
import { Btn, SlideFrame, Ves } from '../../components/ui';
import { useAnimTime } from '../../hooks/useAnimTime';
import { useSlide } from '../SlideContext';
import { COURSE, PROFESSOR, SCHOOL, TEAM } from '../../content/people';

// 0.1 Portada
export function Portada() {
  const [t] = useAnimTime(true, 0.8);
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4 animate-pop">
      <span className="rounded-full bg-navy/10 px-4 py-1 text-sm font-bold text-azul">
        {COURSE}
      </span>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-navy leading-tight">
        Señales de reloj <span className="text-naranja">y</span> diagramas de tiempo
      </h1>
      <div className="w-full max-w-xl rounded-3xl bg-white p-3 ring-1 ring-slate-200">
        <TimingDiagram
          from={t}
          to={t + 6}
          width={480}
          rowHeight={56}
          hideLabels
          signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        {TEAM.map((p) => (
          <span key={p.short} className="font-bold text-navy">
            {p.full}
          </span>
        ))}
      </div>
      <p className="text-slate-500 font-semibold">
        Docente: {PROFESSOR} · {SCHOOL}
      </p>
    </div>
  );
}

// 0.2 Pregunta gancho
export function Gancho() {
  const { session } = useSlide();
  const open = session.activeQuizId === 'gancho' && session.quizState !== 'idle';
  return (
    <SlideFrame emoji="🤔" title="Una pregunta para empezar">
      <div className="rounded-3xl bg-navy text-white p-6 sm:p-10 text-center">
        <div className="text-6xl sm:text-8xl font-extrabold text-naranja">3 GHz</div>
        <p className="mt-4 text-xl sm:text-3xl font-bold leading-snug">
          ¿Hace exactamente <span className="text-naranja">3.000 millones</span> de instrucciones por segundo?
        </p>
      </div>
      <Ves>{open ? 'Vota en la tarjeta de pregunta 👆' : 'La respuesta… al final del Bloque 3 🔒'}</Ves>
    </SlideFrame>
  );
}

// 0.3 Puente: el flip-flop no cambia hasta que el reloj lo dice
export function Puente() {
  const [d, setD] = useState<0 | 1>(0);
  const [q, setQ] = useState<0 | 1>(0);
  const [flash, setFlash] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const tick = () => {
    setQ(d);
    setFlash(true);
    setMsg(d === q ? 'Tic ▲ … Q ya tenía ese valor.' : `¿Ves? Con el tic ▲, Q guardó el ${d}.`);
    window.setTimeout(() => setFlash(false), 350);
  };

  return (
    <SlideFrame
      emoji="🔗"
      title="¿Quién dice cuándo cambiar?"
      text="Los flip-flops guardan un bit… pero ¿quién les dice cuándo cambiar? El reloj."
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Btn
          big
          variant={d ? 'accent' : 'secondary'}
          onClick={() => {
            setD(d ? 0 : 1);
            setMsg('Cambiaste D… pero Q no se mueve. Falta el reloj.');
          }}
        >
          D = {d}
        </Btn>
        <div
          className={`rounded-3xl px-5 py-6 text-center font-extrabold text-white transition ${
            flash ? 'bg-naranja scale-105' : 'bg-navy'
          }`}
        >
          Flip-flop
        </div>
        <div className="rounded-2xl bg-white ring-2 ring-navy/15 py-4 text-center text-2xl font-extrabold text-navy">
          Q = {q}
        </div>
      </div>
      <Btn big variant="primary" onClick={tick} className="w-full">
        ▲ Tic del reloj
      </Btn>
      {msg && <Ves tone={msg.startsWith('¿Ves') ? 'green' : 'blue'}>{msg}</Ves>}
    </SlideFrame>
  );
}

// 0.4 Lo que veremos
const AGENDA = [
  { icon: '⏱️', title: 'El reloj', who: TEAM[0].full, text: 'El ritmo de todo.' },
  { icon: '📈', title: 'Diagramas', who: TEAM[1].full, text: 'Ver cada tic dibujado.' },
  { icon: '💻', title: 'Ensamblador', who: TEAM[2].full, text: 'Cada instrucción cuesta tics.' },
];

export function Agenda() {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <SlideFrame emoji="🗺️" title="Lo que veremos" text="Toca cada parada del viaje.">
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {AGENDA.map((a, i) => (
          <div key={a.title} className="flex sm:flex-1 flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setSel(i)}
              className={`w-full rounded-3xl p-5 text-center ring-2 transition active:scale-95 ${
                sel === i ? 'bg-navy text-white ring-navy' : 'bg-white text-navy ring-slate-200'
              }`}
            >
              <div className="text-5xl">{a.icon}</div>
              <div className="mt-2 text-xl font-extrabold">{a.title}</div>
              {sel === i && <div className="mt-1 font-semibold animate-pop">{a.text}</div>}
              <div className={`mt-1 text-sm font-semibold ${sel === i ? 'text-white/70' : 'text-slate-500'}`}>{a.who}</div>
            </button>
            {i < AGENDA.length - 1 && <span className="text-3xl text-naranja font-extrabold rotate-90 sm:rotate-0">→</span>}
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}
