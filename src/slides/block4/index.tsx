import { useState } from 'react';
import { TimingDiagram } from '../../components/timing/TimingDiagram';
import { Btn, SlideFrame, Ves } from '../../components/ui';
import { Confetti } from '../../components/ui/Confetti';
import { useAnimTime } from '../../hooks/useAnimTime';
import { useSlide } from '../SlideContext';

// 4.1 Tres frases
const PHRASES = [
  { who: 'Juan José', icon: '⏱️', text: 'El reloj marca el ritmo de todo.' },
  { who: 'Cristian', icon: '📈', text: 'Los diagramas de tiempo nos dejan ver cada tic.' },
  { who: 'Renzo', icon: '💻', text: 'En ensamblador, cada instrucción cuesta tics de reloj.' },
];

export function TresFrases() {
  const [shown, setShown] = useState(0);
  return (
    <SlideFrame emoji="🎤" title="Tres ideas para llevarse" text="Toca para revelar una por una.">
      <div className="grid gap-3">
        {PHRASES.map((p, i) => {
          const open = i < shown;
          const isNext = i === shown;
          return (
            <button
              key={p.who}
              disabled={!isNext}
              onClick={() => setShown(i + 1)}
              className={`rounded-3xl p-5 text-left ring-2 transition ${
                open ? 'bg-navy text-white ring-navy animate-pop' : isNext ? 'bg-white ring-naranja active:scale-95' : 'bg-white/60 ring-slate-200'
              }`}
            >
              <div className={`text-sm font-bold ${open ? 'text-naranja' : 'text-slate-500'}`}>
                {p.icon} {p.who}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-extrabold">{open ? p.text : isNext ? 'Toca para ver 👆' : '· · ·'}</div>
            </button>
          );
        })}
      </div>
    </SlideFrame>
  );
}

// 4.2 Pregunta final
export function PreguntaFinal() {
  const { session } = useSlide();
  const live = session.activeQuizId === 'final' && session.quizState !== 'idle';
  return (
    <SlideFrame emoji="🏁" title="Pregunta final">
      <div className="rounded-3xl bg-navy text-white p-6 text-center space-y-3">
        <div className="text-3xl sm:text-5xl font-extrabold">
          8086 · <span className="text-naranja">5 MHz</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold">+ 🐢 1 tic de espera</div>
        <div className="text-xl sm:text-2xl font-semibold opacity-90">¿Cuánto tarda la lectura?</div>
      </div>
      <Ves>{live ? 'Responde en la tarjeta de pregunta 👆' : 'Prepárate… 👀'}</Ves>
    </SlideFrame>
  );
}

// 4.3 Top 5
const MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

export function Top5() {
  const { session } = useSlide();
  const top = session.ranking.slice(0, 5);
  if (!session.showRanking || !top.length) {
    return (
      <SlideFrame emoji="🏆" title="Top 5">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-10 text-center text-2xl font-bold text-slate-400">
          🥁 Muy pronto…
        </div>
      </SlideFrame>
    );
  }
  return (
    <SlideFrame emoji="🏆" title="Top 5" text="Quienes más acertaron.">
      <div className="space-y-2">
        {top.map((r, i) => (
          <div
            key={`${r.name}${i}`}
            className={`flex items-center gap-3 rounded-2xl p-3 ring-2 animate-pop ${
              i === 0 ? 'bg-naranja text-white ring-naranja' : 'bg-white text-navy ring-slate-200'
            }`}
            style={{ animationDelay: `${(top.length - i) * 0.15}s` }}
          >
            <span className="w-10 text-center text-3xl font-extrabold">{MEDALS[i]}</span>
            <span className="flex-1 text-xl font-extrabold truncate">{r.name}</span>
            <span className="text-xl font-extrabold">{r.points} pts</span>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}

// 4.4 ¡Gracias!
export function Gracias() {
  const [party, setParty] = useState(0);
  const [t] = useAnimTime(true, 1);
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center animate-pop">
      {party > 0 && <Confetti key={party} />}
      <div className="text-7xl">🙌</div>
      <h2 className="text-5xl sm:text-6xl font-extrabold text-navy">¡Gracias!</h2>
      <p className="text-lg font-semibold text-slate-600">Juan José · Cristian · Renzo</p>
      <div className="w-full max-w-md">
        <TimingDiagram from={t} to={t + 5} hideLabels rowHeight={50} signals={[{ kind: 'clock', name: 'CLK', period: 1, marks: true }]} />
      </div>
      <Btn big variant="accent" onClick={() => setParty((p) => p + 1)}>
        🎉 ¡Celebrar!
      </Btn>
      <Ves>Todo queda abierto para repasar 📚</Ves>
    </div>
  );
}
