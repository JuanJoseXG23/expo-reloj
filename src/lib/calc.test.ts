import { describe, expect, it } from 'vitest';
import {
  busCycleSeconds,
  busCycleTics,
  cpuFreqFromCrystal,
  delayLoopCycles,
  delayLoopSeconds,
  dutyPercent,
  freqToSlider,
  highSeconds,
  instructionsPerSecond,
  maxFreqHz,
  programCycles,
  sliderToFreq,
  tickSeconds,
} from './calc';
import { fmtCount, fmtFreq, fmtInt, fmtTime } from './format';

describe('duración del tic', () => {
  it('8086 a 5 MHz → 200 ns', () => {
    expect(tickSeconds(5e6)).toBeCloseTo(200e-9, 15);
    expect(fmtTime(tickSeconds(5e6))).toBe('200 ns');
  });
  it('8 MHz → 125 ns (pregunta del bloque 1)', () => {
    expect(fmtTime(tickSeconds(8e6))).toBe('125 ns');
  });
  it('3 GHz → ≈0,333 ns', () => {
    expect(fmtTime(tickSeconds(3e9))).toBe('0,333 ns');
    expect(fmtTime(tickSeconds(3e9), 1)).toBe('0,3 ns');
  });
  it('1 Hz → 1 s', () => {
    expect(fmtTime(tickSeconds(1))).toBe('1 s');
  });
  it('rechaza frecuencias no positivas', () => {
    expect(() => tickSeconds(0)).toThrow();
  });
});

describe('% en alto', () => {
  it('reloj del 8086: 1/3 en alto', () => {
    const t = tickSeconds(5e6);
    expect(dutyPercent(t / 3, (2 * t) / 3)).toBeCloseTo(33.33, 2);
  });
  it('tiempo en alto con 33 % a 5 MHz ≈ 66,7 ns', () => {
    expect(highSeconds(5e6, 100 / 3)).toBeCloseTo(66.67e-9, 11);
  });
  it('50 % es simétrico', () => {
    expect(dutyPercent(1, 1)).toBe(50);
  });
});

describe('slider de frecuencia', () => {
  it('extremos 1 Hz y 5 GHz', () => {
    expect(sliderToFreq(0)).toBe(1);
    expect(sliderToFreq(1)).toBe(5e9);
  });
  it('ida y vuelta conserva el valor', () => {
    expect(sliderToFreq(freqToSlider(5e6))).toBe(5e6);
    expect(sliderToFreq(freqToSlider(3e9))).toBe(3e9);
  });
});

describe('8284A', () => {
  it('cristal de 15 MHz → 8086 a 5 MHz', () => {
    expect(cpuFreqFromCrystal(15e6)).toBe(5e6);
    expect(fmtFreq(cpuFreqFromCrystal(15e6))).toBe('5 MHz');
  });
});

describe('velocidad máxima', () => {
  it('5 + 10 + 5 ns = 20 ns → 50 MHz', () => {
    expect(maxFreqHz(5, 10, 5)).toBeCloseTo(50e6, 3);
    expect(fmtFreq(maxFreqHz(5, 10, 5))).toBe('50 MHz');
  });
  it('el camino más lento manda: más lógica → menos MHz', () => {
    expect(maxFreqHz(5, 30, 5)).toBeLessThan(maxFreqHz(5, 10, 5));
  });
});

describe('ciclo de bus del 8086', () => {
  it('sin espera: 4 tics = 800 ns a 5 MHz', () => {
    expect(busCycleTics(0)).toBe(4);
    expect(fmtTime(busCycleSeconds(5e6, 0))).toBe('800 ns');
  });
  it('1 tic de espera: 5 tics = 1 µs', () => {
    expect(busCycleTics(1)).toBe(5);
    expect(fmtTime(busCycleSeconds(5e6, 1))).toBe('1 µs');
  });
  it('2 y 3 tics de espera: 1,2 µs y 1,4 µs', () => {
    expect(fmtTime(busCycleSeconds(5e6, 2))).toBe('1,2 µs');
    expect(fmtTime(busCycleSeconds(5e6, 3))).toBe('1,4 µs');
  });
});

describe('instrucciones', () => {
  it('suma los ciclos del programa', () => {
    expect(programCycles(['movrr', 'add', 'inc'])).toBe(7);
    expect(programCycles(['mul'])).toBe(118);
    expect(programCycles(['div'])).toBe(144);
  });
  it('MUL cuesta ~60 veces más que MOV', () => {
    expect(Math.round(programCycles(['mul']) / programCycles(['movrr']) / 10) * 10).toBe(60);
  });
});

describe('bucle de retardo', () => {
  it('N = 1000 → 19.992 ciclos ≈ 4 ms a 5 MHz', () => {
    expect(delayLoopCycles(1000)).toBe(19992);
    expect(fmtInt(delayLoopCycles(1000))).toBe('19.992');
    expect(delayLoopSeconds(1000, 5e6)).toBeCloseTo(3.9984e-3, 10);
    expect(fmtTime(delayLoopSeconds(1000, 5e6), 1)).toBe('4 ms');
  });
  it('N = 1 → 4 + 3 + 0 + 5 = 12 ciclos', () => {
    expect(delayLoopCycles(1)).toBe(12);
  });
  it('rechaza N inválido', () => {
    expect(() => delayLoopCycles(0)).toThrow();
  });
});

describe('formatos', () => {
  it('cantidades en palabras', () => {
    expect(fmtCount(5e6)).toBe('5 millones');
    expect(fmtCount(1e6)).toBe('1 millón');
    expect(fmtCount(3e9)).toBe('3.000 millones');
    expect(fmtCount(50)).toBe('50');
  });
  it('instrucciones por segundo a 3 GHz', () => {
    expect(fmtCount(instructionsPerSecond(3e9, 118))).toBe('25,4 millones');
  });
});
