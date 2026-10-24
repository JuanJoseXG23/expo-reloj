// Avatares pequeños y graciosos, siempre iguales para la misma persona (salen de su uid).

const COLORS = ['#F39C12', '#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C', '#2ECC71', '#E67E22', '#FF6FAE', '#5D6DFF', '#00B8D4'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Elige una opción distinta para cada rasgo usando partes del hash. */
function pick(h: number, shift: number, n: number) {
  return (h >>> shift) % n;
}

export function Avatar({ seed, size = 56, bob = true }: { seed: string; size?: number; bob?: boolean }) {
  const h = hash(seed || 'x');
  const color = COLORS[pick(h, 0, COLORS.length)];
  const body = pick(h, 4, 3);
  const eyes = pick(h, 7, 6);
  const mouth = pick(h, 10, 5);
  const extra = pick(h, 13, 5);
  const blush = pick(h, 16, 2) === 1;
  const delay = (h % 1000) / 1000;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={bob ? 'avatar-bob' : undefined}
      style={{ animationDelay: `-${delay * 2}s` }}
      aria-hidden
    >
      {/* Accesorio de arriba */}
      {extra === 1 && (
        <g>
          <line x1="32" y1="12" x2="32" y2="3" stroke="#1F3A5F" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="4" r="3.5" fill="#D35400" />
        </g>
      )}
      {extra === 2 && <path d="M22 14 L32 0 L42 14 Z" fill="#F1C40F" stroke="#1F3A5F" strokeWidth="2" strokeLinejoin="round" />}
      {extra === 3 && <path d="M26 13 Q28 4 32 10 Q35 3 38 13" fill="none" stroke="#1F3A5F" strokeWidth="2.5" strokeLinecap="round" />}

      {/* Cuerpo */}
      {body === 0 && <circle cx="32" cy="36" r="24" fill={color} />}
      {body === 1 && <rect x="9" y="13" width="46" height="46" rx="16" fill={color} />}
      {body === 2 && (
        <path d="M10 40 Q10 12 32 12 Q54 12 54 40 L54 58 L47 53 L40 58 L32 53 L24 58 L17 53 L10 58 Z" fill={color} />
      )}
      {extra === 4 && (
        <g fill={color} stroke="#1F3A5F" strokeWidth="0">
          <circle cx="13" cy="20" r="7" />
          <circle cx="51" cy="20" r="7" />
        </g>
      )}

      {/* Ojos */}
      <Eyes kind={eyes} />

      {/* Mejillas */}
      {blush && (
        <g fill="#FF6FAE" opacity=".55">
          <ellipse cx="18" cy="42" rx="4" ry="2.5" />
          <ellipse cx="46" cy="42" rx="4" ry="2.5" />
        </g>
      )}

      {/* Boca */}
      <Mouth kind={mouth} />
    </svg>
  );
}

function Eyes({ kind }: { kind: number }) {
  const ink = '#1F3A5F';
  switch (kind) {
    case 0: // puntos
      return (
        <g fill={ink}>
          <circle cx="24" cy="32" r="3.5" />
          <circle cx="40" cy="32" r="3.5" />
        </g>
      );
    case 1: // ojos saltones
      return (
        <g>
          <circle cx="23" cy="30" r="7" fill="#fff" />
          <circle cx="41" cy="30" r="7" fill="#fff" />
          <circle cx="25" cy="31" r="3.2" fill={ink} />
          <circle cx="39" cy="29" r="3.2" fill={ink} />
        </g>
      );
    case 2: // felices ^^
      return (
        <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
          <path d="M19 33 Q24 26 29 33" />
          <path d="M35 33 Q40 26 45 33" />
        </g>
      );
    case 3: // guiño
      return (
        <g>
          <circle cx="24" cy="32" r="3.5" fill={ink} />
          <path d="M35 32 L45 32" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 4: // gafas de sol
      return (
        <g fill={ink}>
          <rect x="15" y="27" width="14" height="9" rx="3" />
          <rect x="35" y="27" width="14" height="9" rx="3" />
          <rect x="29" y="29" width="6" height="2.5" />
          <rect x="18" y="29" width="4" height="2" fill="#fff" opacity=".6" />
        </g>
      );
    default: // un solo ojo grande
      return (
        <g>
          <circle cx="32" cy="30" r="9" fill="#fff" />
          <circle cx="34" cy="31" r="4.5" fill={ink} />
          <circle cx="35.5" cy="29.5" r="1.4" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ kind }: { kind: number }) {
  const ink = '#1F3A5F';
  switch (kind) {
    case 0: // sonrisa
      return <path d="M24 44 Q32 51 40 44" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />;
    case 1: // "o" de sorpresa
      return <ellipse cx="32" cy="46" rx="4" ry="5" fill={ink} />;
    case 2: // lengua afuera
      return (
        <g>
          <path d="M23 43 Q32 50 41 43" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M30 46 Q30 53 33.5 53 Q37 53 37 46" fill="#FF6FAE" stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 3: // sonrisa con dientes
      return (
        <g>
          <path d="M22 42 Q32 54 42 42 Z" fill={ink} />
          <rect x="27" y="42" width="10" height="3.5" fill="#fff" />
        </g>
      );
    default: // boca de gato "w"
      return <path d="M24 44 Q28 49 32 44 Q36 49 40 44" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />;
  }
}
