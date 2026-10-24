import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BLOCKS } from '../content/blocks';
import { SlideView } from '../components/SlideView';
import { DEFAULT_SESSION } from '../lib/types';

// Cada pantalla se dibuja sin errores, en distintos estados de la sesión.
describe('pantallas', () => {
  const states = [
    DEFAULT_SESSION,
    { ...DEFAULT_SESSION, status: 'live' as const, activeQuizId: 'gancho', quizState: 'results' as const },
    { ...DEFAULT_SESSION, status: 'ended' as const, showRanking: true, ranking: [{ name: 'Ana', points: 3 }] },
    { ...DEFAULT_SESSION, status: 'live' as const, doneQuizzes: ['b1-tic', 'b2-q', 'b3-tics'], activeQuizId: 'b1-flanco', quizState: 'open' as const },
  ];
  for (const b of BLOCKS) {
    for (const [i, s] of b.slides.entries()) {
      it(`${s.id} ${s.title}`, () => {
        for (const session of states) {
          const html = renderToString(<SlideView block={b.id} slide={i} session={session} mode="student" />);
          expect(html.length).toBeGreaterThan(50);
        }
      });
    }
  }
});
