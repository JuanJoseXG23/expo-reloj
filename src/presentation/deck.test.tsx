import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BLOCKS } from '../content/blocks';
import { DEFAULT_SESSION } from '../lib/types';
import { DECK } from './deck';
import { DeckContext } from './kit';
import { LobbySlide } from './Lobby';
import { isPresentationName } from '../pages/Enter';
import { Avatar } from '../components/Avatar';

describe('diapositivas del video beam', () => {
  it('cada pantalla interactiva tiene su diapositiva', () => {
    for (const b of BLOCKS) for (const s of b.slides) expect(DECK[s.id], s.id).toBeDefined();
  });

  const sessions = [
    { ...DEFAULT_SESSION, status: 'live' as const },
    { ...DEFAULT_SESSION, status: 'live' as const, doneQuizzes: ['b1-tic', 'b2-q', 'gancho', 'final'], showRanking: true, ranking: [{ name: 'Ana', points: 3 }] },
  ];
  for (const [id, Comp] of Object.entries(DECK)) {
    it(`dibuja ${id}`, () => {
      for (const session of sessions) {
        const html = renderToString(
          <DeckContext.Provider value={{ session, code: id, kicker: 'Bloque' }}>
            <Comp />
          </DeckContext.Provider>,
        );
        expect(html.length).toBeGreaterThan(100);
      }
    });
  }

  it('lobby con y sin conectados', () => {
    expect(renderToString(<LobbySlide online={[]} />)).toContain('avatares');
    const html = renderToString(<LobbySlide online={[{ uid: 'a1', name: 'Laura', lastSeen: 0 }]} />);
    expect(html).toContain('Laura');
  });
});

describe('perfil presentación', () => {
  it('reconoce el nombre con o sin tilde y mayúsculas', () => {
    expect(isPresentationName('presentacion')).toBe(true);
    expect(isPresentationName('Presentación')).toBe(true);
    expect(isPresentationName('PRESENTACION ')).toBe(true);
    expect(isPresentationName('Presentaciones')).toBe(false);
    expect(isPresentationName('Laura')).toBe(false);
  });
});

describe('avatares', () => {
  it('el mismo uid da siempre el mismo avatar y uids distintos suelen variar', () => {
    const a = renderToString(<Avatar seed="uid-123" />);
    expect(renderToString(<Avatar seed="uid-123" />)).toBe(a);
    const variants = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) => renderToString(<Avatar seed={s} />)));
    expect(variants.size).toBeGreaterThan(4);
  });
});
