import { describe, expect, it } from 'vitest';
import { computeRanking, QUIZZES } from './quizzes';

describe('preguntas', () => {
  it('todas tienen 3 o 4 opciones y una correcta válida', () => {
    for (const q of QUIZZES) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options.length).toBeLessThanOrEqual(4);
      if (q.correct !== null) expect(q.options[q.correct]).toBeDefined();
    }
  });
  it('ids únicos', () => {
    expect(new Set(QUIZZES.map((q) => q.id)).size).toBe(QUIZZES.length);
  });
  it('respuestas correctas de la exposición', () => {
    const text = (id: string) => {
      const q = QUIZZES.find((x) => x.id === id)!;
      return q.options[q.correct!].text;
    };
    expect(text('b1-tic')).toBe('125 ns');
    expect(text('b1-duty')).toBe('33 %');
    expect(text('b3-tics')).toBe('4');
    expect(text('b3-costo')).toBe('MUL');
    expect(text('final')).toBe('1 µs');
  });
});

describe('ranking', () => {
  it('cuenta aciertos recalculando desde la opción (ignora el campo correct del cliente)', () => {
    const r = computeRanking([
      { uid: 'a', name: 'Ana', quizId: 'b1-tic', option: 1 },
      { uid: 'a', name: 'Ana', quizId: 'final', option: 1 },
      { uid: 'b', name: 'Beto', quizId: 'b1-tic', option: 0 },
      { uid: 'b', name: 'Beto', quizId: 'gancho', option: 2 },
    ]);
    expect(r[0]).toMatchObject({ name: 'Ana', points: 2 });
    expect(r[1]).toMatchObject({ name: 'Beto', points: 0 });
  });
});
