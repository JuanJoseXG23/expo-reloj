export type Speaker = 'Juan José' | 'Cristian' | 'Renzo' | 'Los tres';
export type SessionStatus = 'lobby' | 'live' | 'ended';
export type QuizState = 'idle' | 'open' | 'closed' | 'results';

export interface RankingEntry {
  name: string;
  points: number;
}

export interface SessionState {
  status: SessionStatus;
  unlockedBlocks: number[];
  currentBlock: number;
  currentSlide: number;
  currentSpeaker: Speaker;
  activeQuizId: string | null;
  quizState: QuizState;
  showRanking: boolean;
  ranking: RankingEntry[];
  /** preguntas cuyos resultados ya se mostraron (se pueden repasar). */
  doneQuizzes: string[];
  /** ms desde epoch; null si no ha empezado. */
  startedAt: number | null;
}

export const DEFAULT_SESSION: SessionState = {
  status: 'lobby',
  unlockedBlocks: [],
  currentBlock: 0,
  currentSlide: 0,
  currentSpeaker: 'Juan José',
  activeQuizId: null,
  quizState: 'idle',
  showRanking: false,
  ranking: [],
  doneQuizzes: [],
  startedAt: null,
};

export interface Participant {
  uid: string;
  name: string;
  lastSeen: number;
}

export interface Answer {
  uid: string;
  name: string;
  quizId: string;
  option: number;
  correct: boolean;
}
