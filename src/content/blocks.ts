import type { ComponentType } from 'react';
import type { Speaker } from '../lib/types';
import { makeQuizSlide } from '../slides/QuizSlide';
import { Agenda, Gancho, Portada, Puente } from '../slides/block0';
import { Comparacion, JuegaReloj, Metronomo, Origen, SubeBaja } from '../slides/block1';
import { FlipFlopD, LlegasteTarde, MaxVelocidad, QueEs, Retardo, Simbolos } from '../slides/block2';
import { ArmaPrograma, LecturaMemoria, MemoriaLenta, PausaCodigo, RespuestaGancho, TicsCiclos } from '../slides/block3';
import { Gracias, PreguntaFinal, Top5, TresFrases } from '../slides/block4';

export interface SlideDef {
  id: string;
  title: string;
  component: ComponentType;
  /** pregunta asociada a esta pantalla (el panel la sugiere). */
  quizId?: string;
}

export interface BlockDef {
  id: number;
  title: string;
  icon: string;
  speaker: Speaker;
  /** minutos objetivo [inicio, fin] desde que empieza la exposición. */
  target: [number, number];
  slides: SlideDef[];
}

export const BLOCKS: BlockDef[] = [
  {
    id: 0,
    title: 'Apertura',
    icon: '🚀',
    speaker: 'Juan José',
    target: [0, 1.5],
    slides: [
      { id: '0.1', title: 'Portada', component: Portada },
      { id: '0.2', title: 'Pregunta gancho', component: Gancho, quizId: 'gancho' },
      { id: '0.3', title: 'Puente', component: Puente },
      { id: '0.4', title: 'Lo que veremos', component: Agenda },
    ],
  },
  {
    id: 1,
    title: 'El reloj',
    icon: '⏱️',
    speaker: 'Juan José',
    target: [1.5, 6.5],
    slides: [
      { id: '1.1', title: 'Metrónomo', component: Metronomo },
      { id: '1.2', title: 'Juega con el reloj', component: JuegaReloj },
      { id: '1.3', title: '¿Sube o baja?', component: SubeBaja },
      { id: '1.4', title: '¿De dónde sale?', component: Origen },
      { id: '1.5', title: 'Más rápido = más corto', component: Comparacion },
      { id: '1.q', title: 'Mini-quiz', component: makeQuizSlide(1) },
    ],
  },
  {
    id: 2,
    title: 'Diagramas de tiempo',
    icon: '📈',
    speaker: 'Cristian',
    target: [6.5, 12.5],
    slides: [
      { id: '2.1', title: '¿Qué es?', component: QueEs },
      { id: '2.2', title: 'Símbolos', component: Simbolos },
      { id: '2.3', title: 'Nada es instantáneo', component: Retardo },
      { id: '2.4', title: 'Flip-flop D', component: FlipFlopD },
      { id: '2.5', title: 'Llegaste tarde', component: LlegasteTarde },
      { id: '2.6', title: '¿Por qué no infinitos GHz?', component: MaxVelocidad },
      { id: '2.q', title: 'Mini-quiz', component: makeQuizSlide(2) },
    ],
  },
  {
    id: 3,
    title: 'El reloj en ensamblador',
    icon: '💻',
    speaker: 'Renzo',
    target: [12.5, 18.5],
    slides: [
      { id: '3.1', title: 'Tics, ciclos e instrucciones', component: TicsCiclos },
      { id: '3.2', title: 'Leyendo memoria', component: LecturaMemoria },
      { id: '3.3', title: 'Memoria lenta', component: MemoriaLenta },
      { id: '3.4', title: 'Arma tu programa', component: ArmaPrograma },
      { id: '3.5', title: 'Pausa con código', component: PausaCodigo },
      { id: '3.6', title: 'Respuesta al gancho', component: RespuestaGancho, quizId: 'gancho' },
      { id: '3.q', title: 'Mini-quiz', component: makeQuizSlide(3) },
    ],
  },
  {
    id: 4,
    title: 'Cierre',
    icon: '🏁',
    speaker: 'Los tres',
    target: [18.5, 20],
    slides: [
      { id: '4.1', title: 'Tres frases', component: TresFrases },
      { id: '4.2', title: 'Pregunta final', component: PreguntaFinal, quizId: 'final' },
      { id: '4.3', title: 'Top 5', component: Top5 },
      { id: '4.4', title: '¡Gracias!', component: Gracias },
    ],
  },
];

export const ALL_BLOCK_IDS = BLOCKS.map((b) => b.id);

export function getSlide(block: number, slide: number): SlideDef | undefined {
  return BLOCKS[block]?.slides[slide];
}

/** Siguiente posición (salta al siguiente bloque al final). null si es la última. */
export function nextPos(block: number, slide: number): { block: number; slide: number } | null {
  if (slide + 1 < (BLOCKS[block]?.slides.length ?? 0)) return { block, slide: slide + 1 };
  if (block + 1 < BLOCKS.length) return { block: block + 1, slide: 0 };
  return null;
}

export function prevPos(block: number, slide: number): { block: number; slide: number } | null {
  if (slide > 0) return { block, slide: slide - 1 };
  if (block > 0) return { block: block - 1, slide: BLOCKS[block - 1].slides.length - 1 };
  return null;
}

/** Bloques visibles para el estudiante: los desbloqueados, o todos en modo repaso. */
export function visibleBlocks(status: string, unlocked: number[]): number[] {
  return status === 'ended' ? ALL_BLOCK_IDS : [...unlocked].sort((a, b) => a - b);
}
