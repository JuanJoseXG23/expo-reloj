import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Marco de cada pantalla: título corto + 1–2 frases + lo interactivo. */
export function SlideFrame({
  title,
  text,
  children,
  emoji,
}: {
  title: string;
  text?: ReactNode;
  children?: ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy leading-tight">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h2>
        {text && <p className="mt-1 text-base sm:text-lg text-slate-600 leading-snug">{text}</p>}
      </header>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-3 sm:p-4 ${className}`}>{children}</div>;
}

type BtnVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success';

const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-navy text-white hover:bg-azul',
  secondary: 'bg-white text-navy ring-2 ring-navy/15 hover:ring-navy/40',
  accent: 'bg-naranja text-white hover:brightness-110',
  ghost: 'bg-transparent text-navy hover:bg-navy/5',
  danger: 'bg-rojo text-white hover:brightness-110',
  success: 'bg-verde text-white hover:brightness-110',
};

export function Btn({
  variant = 'primary',
  big = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; big?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-2xl font-bold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
        big ? 'px-6 py-4 text-lg' : 'px-4 py-2.5 text-base'
      } ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  accent = '#2E5C8A',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: ReactNode;
  accent?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-semibold text-navy">{label}</span>
        <span className="font-mono font-bold text-lg text-azul">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-10 cursor-pointer"
        style={{ accentColor: accent }}
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 font-semibold text-navy active:scale-95 transition"
    >
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-naranja' : 'bg-slate-300'}`}>
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </span>
      {label}
    </button>
  );
}

export function Stat({
  label,
  value,
  tone = 'navy',
}: {
  label: string;
  value: ReactNode;
  tone?: 'navy' | 'orange' | 'green' | 'red';
}) {
  const color = { navy: 'text-navy', orange: 'text-naranja', green: 'text-verde', red: 'text-rojo' }[tone];
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 text-center">
      <div className="text-xs sm:text-sm font-semibold text-slate-500">{label}</div>
      <div className={`text-xl sm:text-2xl font-extrabold leading-tight ${color}`}>{value}</div>
    </div>
  );
}

/** Mensaje corto tipo "¿Ves? …" después de interactuar. */
export function Ves({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'red' | 'orange' }) {
  const styles = {
    blue: 'bg-azul/10 text-navy ring-azul/30',
    green: 'bg-verde/10 text-verde ring-verde/30',
    red: 'bg-rojo/10 text-rojo ring-rojo/30',
    orange: 'bg-naranja/10 text-naranja ring-naranja/30',
  }[tone];
  return (
    <div key={String(children)} className={`rounded-2xl px-4 py-3 font-bold text-base sm:text-lg ring-1 animate-pop ${styles}`}>
      {children}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white ring-1 ring-slate-200 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-3 py-2 font-bold transition active:scale-95 ${
            o.value === value ? 'bg-navy text-white' : 'text-navy hover:bg-navy/5'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
