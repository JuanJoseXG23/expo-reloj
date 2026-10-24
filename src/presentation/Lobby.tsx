import { Avatar } from '../components/Avatar';
import { JoinQr } from '../components/Qr';
import { COURSE, PROFESSOR, SCHOOL, TEAM, TOPIC } from '../content/people';
import type { Participant } from '../lib/types';

const MAX_AVATARS = 32; // dos filas; el resto se muestra como "+N"

/** Pantalla de espera del video beam: QR para entrar y los conectados con su avatar. */
export function LobbySlide({ online }: { online: Participant[] }) {
  const shown = online.slice(0, MAX_AVATARS);
  // Con muchos conectados, avatares más pequeños para que quepan en dos filas.
  const compact = online.length > 13;
  const size = compact ? 44 : 58;
  const cell = compact ? 'w-[76px]' : 'w-[92px]';
  const extra = online.length - shown.length;
  return (
    <div className="absolute inset-0 flex flex-col px-16 pb-8 pt-12">
      <div className="grid flex-1 grid-cols-[1.35fr_1fr] items-center gap-12">
        <div className="space-y-5">
          <div className="text-[24px] font-bold text-azul">
            {COURSE} · {SCHOOL}
          </div>
          <h1 className="text-[76px] font-extrabold leading-[1.02] text-navy">{TOPIC}</h1>
          <div className="space-y-1 text-[28px] font-bold text-navy">
            {TEAM.map((p) => (
              <div key={p.short}>{p.full}</div>
            ))}
          </div>
          <div className="text-[24px] font-semibold text-slate-500">Docente: {PROFESSOR}</div>
          <div className="inline-flex items-center gap-3 rounded-full bg-naranja px-7 py-3 text-[28px] font-bold text-white">
            📱 Escanea, escribe tu nombre y entra
          </div>
        </div>
        <div className="flex justify-center">
          <JoinQr size={330} />
        </div>
      </div>

      <div className="mt-4 rounded-[28px] bg-white px-6 py-4 ring-1 ring-slate-200">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-[40px] font-extrabold text-navy">{online.length}</span>
          <span className="text-[24px] font-bold text-slate-500">
            {online.length === 1 ? 'compañero conectado' : 'compañeros conectados'}
          </span>
        </div>
        {online.length === 0 ? (
          <div className="py-6 text-center text-[26px] font-semibold text-slate-400">Los avatares aparecen aquí cuando alguien entra 👀</div>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {shown.map((p) => (
              <div key={p.uid} className={`flex ${cell} flex-col items-center animate-pop`}>
                <Avatar seed={p.uid} size={size} />
                <span className="w-full truncate text-center text-[15px] font-bold text-navy">{p.name}</span>
              </div>
            ))}
            {extra > 0 && (
              <div className={`grid ${cell} place-items-center text-[26px] font-extrabold text-azul`} style={{ height: size }}>
                +{extra}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
