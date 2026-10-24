// Cálculos de la exposición. Todo en funciones puras para poder probarlas con Vitest.

/** Duración de un tic (periodo) en segundos. */
export function tickSeconds(freqHz: number): number {
  if (freqHz <= 0) throw new Error('La frecuencia debe ser positiva');
  return 1 / freqHz;
}

/** Tiempo que la señal pasa en alto dentro de un tic, en segundos. */
export function highSeconds(freqHz: number, dutyPercent: number): number {
  return tickSeconds(freqHz) * (dutyPercent / 100);
}

/** % del tic en alto a partir de los tiempos en alto y en bajo. */
export function dutyPercent(highS: number, lowS: number): number {
  return (highS / (highS + lowS)) * 100;
}

// ── Slider logarítmico de frecuencia: 1 Hz … 5 GHz ──────────────────────────
export const FREQ_MIN = 1;
export const FREQ_MAX = 5e9;

/** Convierte una posición 0…1 del slider en una frecuencia (escala logarítmica). */
export function sliderToFreq(pos: number): number {
  const p = Math.min(1, Math.max(0, pos));
  const raw = FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, p);
  return niceFreq(raw);
}

export function freqToSlider(freqHz: number): number {
  return Math.log(freqHz / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN);
}

/** Redondea a 2 cifras significativas para que los números se vean "limpios". */
export function niceFreq(f: number): number {
  if (f <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(f)) - 1);
  return Math.round(f / mag) * mag;
}

// ── 8284A: generador de reloj del 8086 ──────────────────────────────────────
export const CLOCK_DIVIDER_8284 = 3;
export const DUTY_8086 = 100 / 3; // 33 %

export function cpuFreqFromCrystal(crystalHz: number): number {
  return crystalHz / CLOCK_DIVIDER_8284;
}

// ── Velocidad máxima de un circuito ─────────────────────────────────────────
/**
 * Frecuencia máxima = 1 / (sale del flip-flop + pasa por la lógica + llega al siguiente).
 * Tiempos en ns, resultado en Hz.
 */
export function maxFreqHz(clkToQns: number, logicNs: number, setupNs: number): number {
  const total = clkToQns + logicNs + setupNs;
  if (total <= 0) throw new Error('El camino debe durar algo');
  return 1e9 / total;
}

// ── Ciclo de bus del 8086 ───────────────────────────────────────────────────
export const BUS_CYCLE_TICS = 4; // T1, T2, T3, T4

export function busCycleTics(waitStates: number): number {
  return BUS_CYCLE_TICS + waitStates;
}

export function busCycleSeconds(freqHz: number, waitStates: number): number {
  return busCycleTics(waitStates) * tickSeconds(freqHz);
}

// ── Ciclos de instrucciones del 8086 (mejor caso) ──────────────────────────
export interface Instr {
  id: string;
  label: string;
  example: string;
  cycles: number;
}

export const INSTRUCTIONS_8086: Instr[] = [
  { id: 'movrr', label: 'MOV', example: 'MOV AX, BX', cycles: 2 },
  { id: 'movri', label: 'MOV #', example: 'MOV AX, 5', cycles: 4 },
  { id: 'add', label: 'ADD', example: 'ADD AX, BX', cycles: 3 },
  { id: 'inc', label: 'INC', example: 'INC AX', cycles: 2 },
  { id: 'nop', label: 'NOP', example: 'NOP', cycles: 3 },
  { id: 'mul', label: 'MUL', example: 'MUL BX', cycles: 118 },
  { id: 'div', label: 'DIV', example: 'DIV BX', cycles: 144 },
];

export function programCycles(ids: string[]): number {
  return ids.reduce((sum, id) => {
    const ins = INSTRUCTIONS_8086.find((i) => i.id === id);
    if (!ins) throw new Error(`Instrucción desconocida: ${id}`);
    return sum + ins.cycles;
  }, 0);
}

// ── Bucle de retardo ────────────────────────────────────────────────────────
//         MOV  CX, N        ; 4 ciclos
// RETARDO:
//         NOP               ; 3 ciclos × N
//         LOOP RETARDO      ; 17 si salta (N−1 veces), 5 la última
export const DELAY = { mov: 4, nop: 3, loopJump: 17, loopExit: 5 } as const;

export function delayLoopCycles(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new Error('N debe ser un entero ≥ 1');
  return DELAY.mov + DELAY.nop * n + DELAY.loopJump * (n - 1) + DELAY.loopExit;
}

export function delayLoopSeconds(n: number, freqHz: number): number {
  return delayLoopCycles(n) * tickSeconds(freqHz);
}

// ── Pregunta gancho: instrucciones por segundo ──────────────────────────────
export function instructionsPerSecond(freqHz: number, ticsPerInstruction: number): number {
  return freqHz / ticsPerInstruction;
}
