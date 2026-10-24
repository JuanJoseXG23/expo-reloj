// Preguntas en vivo. Viven aquí (no en Firestore): Firestore solo guarda cuál está activa y las respuestas.

/** Dibujo opcional para una opción (se pinta con un mini diagrama de tiempo). */
export type OptionVisual = 'rise' | 'fall' | 'high' | 'low';

export interface QuizOption {
  text: string;
  visual?: OptionVisual;
}

export interface Quiz {
  id: string;
  block: number;
  question: string;
  options: QuizOption[];
  /** Índice de la correcta; null = encuesta sin respuesta correcta (pregunta gancho). */
  correct: number | null;
  /** Pista del tema (se muestra antes de lanzarla, sin revelar la pregunta). */
  topic: string;
  /** Explicación corta que aparece con los resultados y en el repaso. */
  explain: string;
}

export const QUIZZES: Quiz[] = [
  {
    id: 'gancho',
    block: 0,
    question: 'Si un procesador va a 3 GHz, ¿hace exactamente 3.000 millones de instrucciones por segundo?',
    options: [{ text: 'Sí' }, { text: 'No' }, { text: 'Depende' }],
    correct: null,
    topic: '🤔 Instrucciones por segundo',
    explain: 'Depende: unas instrucciones gastan muchos tics y los procesadores modernos hacen varias por tic.',
  },
  {
    id: 'b1-tic',
    block: 1,
    question: 'Un reloj de 8 MHz, ¿cuánto dura cada tic?',
    options: [{ text: '8 ns' }, { text: '125 ns' }, { text: '800 ns' }, { text: '1 µs' }],
    correct: 1,
    topic: '⏱️ Duración del tic',
    explain: '1 ÷ 8 MHz = 125 ns. Más MHz → tic más corto.',
  },
  {
    id: 'b1-flanco',
    block: 1,
    question: '¿Cuál es el flanco de subida?',
    options: [
      { text: 'A', visual: 'fall' },
      { text: 'B', visual: 'high' },
      { text: 'C', visual: 'rise' },
      { text: 'D', visual: 'low' },
    ],
    correct: 2,
    topic: '📈 Flancos del reloj',
    explain: 'El flanco de subida es el salto de 0 a 1 ▲.',
  },
  {
    id: 'b1-duty',
    block: 1,
    question: 'El reloj del 8086 pasa en alto el…',
    options: [{ text: '10 %' }, { text: '33 %' }, { text: '50 %' }, { text: '90 %' }],
    correct: 1,
    topic: '🔲 Tiempo en alto',
    explain: 'El 8284A divide entre 3: el reloj pasa 1 de 3 partes en alto.',
  },
  {
    id: 'b2-q',
    block: 2,
    question: '¿Cuándo cambia Q en el flip-flop D?',
    options: [
      { text: 'Cuando cambia D' },
      { text: 'Cuando el reloj sube ▲' },
      { text: 'Cuando el reloj baja' },
      { text: 'Todo el tiempo' },
    ],
    correct: 1,
    topic: '⭐ Flip-flop D',
    explain: 'Q solo copia a D en el flanco de subida ▲; lo demás se ignora.',
  },
  {
    id: 'b2-meta',
    block: 2,
    question: 'Si D cambia justo en ▲…',
    options: [
      { text: 'Q cambia más rápido' },
      { text: 'No pasa nada' },
      { text: 'El flip-flop se confunde' },
      { text: 'El reloj se detiene' },
    ],
    correct: 2,
    topic: '⏰ Llegar tarde',
    explain: 'Si D cambia justo en ▲, Q tiembla: es la metaestabilidad.',
  },
  {
    id: 'b3-tics',
    block: 3,
    question: '¿Cuántos tics tiene una lectura del 8086 sin espera?',
    options: [{ text: '1' }, { text: '2' }, { text: '4' }, { text: '8' }],
    correct: 2,
    topic: '📖 Lectura de memoria',
    explain: 'T1, T2, T3 y T4: 4 tics = 800 ns a 5 MHz.',
  },
  {
    id: 'b3-costo',
    block: 3,
    question: '¿Qué cuesta más tics?',
    options: [{ text: 'MOV' }, { text: 'INC' }, { text: 'NOP' }, { text: 'MUL' }],
    correct: 3,
    topic: '🧩 Costo de instrucciones',
    explain: 'MUL cuesta ~118 tics; MOV entre registros solo 2.',
  },
  {
    id: 'final',
    block: 4,
    question: 'Un 8086 a 5 MHz con memoria lenta (1 tic de espera). ¿Cuánto tarda la lectura?',
    options: [{ text: '800 ns' }, { text: '1 µs' }, { text: '1,2 µs' }, { text: '200 ns' }],
    correct: 1,
    topic: '🐢 Memoria lenta',
    explain: '4 tics + 1 de espera = 5 tics × 200 ns = 1 µs.',
  },
];

export function getQuiz(id: string | null | undefined): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}

export function quizzesOfBlock(block: number): Quiz[] {
  return QUIZZES.filter((q) => q.block === block);
}

/** Puntaje de cada estudiante: 1 punto por respuesta correcta (calculado aquí, no confiamos en el cliente). */
export function computeRanking(
  answers: { uid: string; name: string; quizId: string; option: number }[],
): { uid: string; name: string; points: number }[] {
  const byUid = new Map<string, { uid: string; name: string; points: number }>();
  for (const a of answers) {
    const quiz = getQuiz(a.quizId);
    const entry = byUid.get(a.uid) ?? { uid: a.uid, name: a.name, points: 0 };
    entry.name = a.name;
    if (quiz && quiz.correct !== null && quiz.correct === a.option) entry.points += 1;
    byUid.set(a.uid, entry);
  }
  return [...byUid.values()].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'es'));
}
