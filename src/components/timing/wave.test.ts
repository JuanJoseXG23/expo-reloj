import { describe, expect, it } from 'vitest';
import { clockEvents, clockLevelAt, risingEdges, toSegments } from './wave';

describe('reloj', () => {
  it('nivel con 33 % en alto', () => {
    expect(clockLevelAt(0.1, 3, 1 / 3)).toBe(1);
    expect(clockLevelAt(1.5, 3, 1 / 3)).toBe(0);
    expect(clockLevelAt(3.2, 3, 1 / 3)).toBe(1);
  });
  it('flancos de subida en una ventana', () => {
    expect(risingEdges(0, 4, 1)).toEqual([0, 1, 2, 3]);
    expect(risingEdges(0.5, 3, 1, 0.25)).toEqual([1.25, 2.25]);
  });
  it('eventos del reloj alternan', () => {
    const ev = clockEvents(0, 2, 1, 0.5);
    expect(ev.map((e) => e.v)).toEqual([1, 0, 1, 0]);
  });
});

describe('tramos', () => {
  it('corta y fusiona valores repetidos', () => {
    const segs = toSegments(
      [
        { t: 1, value: 1 },
        { t: 2, value: 1 },
        { t: 3, value: 0 },
      ],
      0,
      0,
      5,
    );
    expect(segs).toEqual([
      { from: 0, to: 1, value: 0 },
      { from: 1, to: 3, value: 1 },
      { from: 3, to: 5, value: 0 },
    ]);
  });
  it('respeta eventos anteriores a la ventana', () => {
    expect(toSegments([{ t: -1, value: 'A' }], 'Z', 0, 2)).toEqual([{ from: 0, to: 2, value: 'A' }]);
  });
});
