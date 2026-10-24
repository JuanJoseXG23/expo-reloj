import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getDb, SESSION_ID, whenAuthed } from '../firebase';
import { getQuiz } from '../content/quizzes';
import { isLocalMode } from '../lib/sessionStore';
import type { Answer } from '../lib/types';

function answersCol() {
  return collection(getDb(), 'sessions', SESSION_ID, 'answers');
}

function toAnswer(data: Record<string, unknown>): Answer {
  return {
    uid: String(data.uid),
    name: String(data.name),
    quizId: String(data.quizId),
    option: Number(data.option),
    correct: Boolean(data.correct),
  };
}

/** Guarda (o cambia) mi respuesta. Solo funciona mientras la pregunta está abierta. */
export function submitAnswer(uid: string, name: string, quizId: string, option: number) {
  const quiz = getQuiz(quizId);
  return setDoc(doc(answersCol(), `${quizId}_${uid}`), {
    uid,
    name,
    quizId,
    option,
    correct: quiz?.correct === option,
    answeredAt: serverTimestamp(),
  });
}

/** Mi respuesta a una pregunta (siempre la puedo leer). */
export function useMyAnswer(uid: string | null, quizId: string | null) {
  const [option, setOption] = useState<number | null>(null);
  useEffect(() => {
    setOption(null);
    if (!uid || !quizId || isLocalMode()) return;
    return whenAuthed(() =>
      onSnapshot(
        doc(answersCol(), `${quizId}_${uid}`),
        (snap) => setOption(snap.exists() ? Number(snap.data().option) : null),
        () => setOption(null),
      ),
    );
  }, [uid, quizId]);
  return option;
}

/**
 * Respuestas de todos a una pregunta.
 * Estudiantes: solo cuando la pregunta está en "resultados" (lo exigen las reglas).
 * Expositores: siempre.
 */
export function useQuizAnswers(quizId: string | null, enabled: boolean) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  useEffect(() => {
    setAnswers([]);
    if (!quizId || !enabled || isLocalMode()) return;
    return whenAuthed(() =>
      onSnapshot(
        query(answersCol(), where('quizId', '==', quizId)),
        (snap) => setAnswers(snap.docs.map((d) => toAnswer(d.data()))),
        (e) => console.warn('No se pudieron leer respuestas', e),
      ),
    );
  }, [quizId, enabled]);
  return answers;
}

/** Todas las respuestas de la sesión (solo expositores). */
export function useAllAnswers(enabled: boolean) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  useEffect(() => {
    if (!enabled || isLocalMode()) return;
    return whenAuthed(() =>
      onSnapshot(
        answersCol(),
        (snap) => setAnswers(snap.docs.map((d) => toAnswer(d.data()))),
        (e) => console.warn('No se pudieron leer respuestas', e),
      ),
    );
  }, [enabled]);
  return answers;
}

/** Cuenta de votos por opción. */
export function useCounts(answers: Answer[], quizId: string | null) {
  return useMemo(() => {
    const quiz = getQuiz(quizId);
    const counts = new Array(quiz?.options.length ?? 4).fill(0) as number[];
    for (const a of answers) if (a.quizId === quizId && counts[a.option] !== undefined) counts[a.option]++;
    return counts;
  }, [answers, quizId]);
}
