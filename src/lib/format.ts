// Formato de números "para humanos", en español (coma decimal, punto de miles).

/** Redondea a `sig` cifras significativas y lo escribe con coma decimal, sin ceros sobrantes. */
export function fmtNum(x: number, sig = 3): string {
  if (x === 0) return '0';
  const rounded = Number(x.toPrecision(sig));
  const [int, dec] = String(Math.abs(rounded) >= 1e21 ? rounded.toFixed(0) : rounded).split('.');
  const intWithDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${intWithDots},${dec}` : intWithDots;
}

/** Entero con punto de miles: 19992 → "19.992". */
export function fmtInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const TIME_UNITS: [number, string][] = [
  [1, 's'],
  [1e-3, 'ms'],
  [1e-6, 'µs'],
  [1e-9, 'ns'],
];

/** 2e-7 → "200 ns", 1e-6 → "1 µs", 0.0039984 → "4 ms" (con sig=1). */
export function fmtTime(seconds: number, sig = 3): string {
  if (seconds === 0) return '0 s';
  for (const [scale, unit] of TIME_UNITS) {
    const v = seconds / scale;
    // Si al redondear llega a 1000, subir de unidad (ej. 999,9 ns → 1 µs).
    if (Number(v.toPrecision(sig)) >= 1) return `${fmtNum(v, sig)} ${unit}`;
  }
  // La unidad más pequeña que mostramos es ns (ej. 0,3 ns): es la que se usa en clase.
  return `${fmtNum(seconds / 1e-9, sig)} ns`;
}

const FREQ_UNITS: [number, string][] = [
  [1e9, 'GHz'],
  [1e6, 'MHz'],
  [1e3, 'kHz'],
  [1, 'Hz'],
];

/** 5e6 → "5 MHz", 3e9 → "3 GHz". */
export function fmtFreq(hz: number, sig = 3): string {
  for (const [scale, unit] of FREQ_UNITS) {
    if (Number((hz / scale).toPrecision(sig)) >= 1) return `${fmtNum(hz / scale, sig)} ${unit}`;
  }
  return `${fmtNum(hz, sig)} Hz`;
}

/** Cantidades grandes en palabras: 5e6 → "5 millones", 3e9 → "3.000 millones", 1e6 → "1 millón". */
export function fmtCount(n: number): string {
  if (n >= 1e6) {
    const m = Number((n / 1e6).toPrecision(3));
    return m === 1 ? '1 millón' : `${fmtNum(m, 4)} millones`;
  }
  return fmtNum(n, 3);
}
