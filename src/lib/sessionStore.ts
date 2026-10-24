// Fuente única del estado de la sesión.
// Normalmente es Firestore; en "modo local" (plan B sin internet) vive en este navegador
// y se comparte entre pestañas (panel ↔ /presentar) con BroadcastChannel.
import { doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { ensureAuth, firebaseConfigured, getDb, SESSION_ID } from '../firebase';
import { DEFAULT_SESSION, type SessionState } from './types';

const LOCAL_MODE_KEY = 'expo-modo-local';
const LOCAL_STATE_KEY = 'expo-sesion-local';
const CHANNEL = 'expo-reloj';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* almacenamiento bloqueado: seguimos sin persistir */
  }
}

export function isLocalMode(): boolean {
  return !firebaseConfigured || safeGet(LOCAL_MODE_KEY) === '1';
}

export function setLocalMode(on: boolean) {
  safeSet(LOCAL_MODE_KEY, on ? '1' : null);
  const bc = channel();
  bc?.postMessage({ type: 'mode' });
  window.dispatchEvent(new Event('expo-mode'));
}

let bcInstance: BroadcastChannel | null | undefined;
function channel(): BroadcastChannel | null {
  if (bcInstance === undefined) {
    bcInstance = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  }
  return bcInstance;
}

function readLocal(): SessionState {
  const raw = safeGet(LOCAL_STATE_KEY);
  if (!raw) return DEFAULT_SESSION;
  try {
    return { ...DEFAULT_SESSION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SESSION;
  }
}

export function normalize(data: Record<string, unknown> | undefined): SessionState {
  if (!data) return DEFAULT_SESSION;
  const startedAt = data.startedAt instanceof Timestamp ? data.startedAt.toMillis() : null;
  return {
    ...DEFAULT_SESSION,
    ...(data as Partial<SessionState>),
    ranking: Array.isArray(data.ranking) ? (data.ranking as SessionState['ranking']) : [],
    doneQuizzes: Array.isArray(data.doneQuizzes) ? (data.doneQuizzes as string[]) : [],
    startedAt,
  };
}

export interface SessionMeta {
  exists: boolean;
  error: string | null;
  local: boolean;
}

export function subscribeSession(cb: (s: SessionState, meta: SessionMeta) => void): () => void {
  if (isLocalMode()) {
    const emit = () => cb(readLocal(), { exists: true, error: null, local: true });
    emit();
    const bc = channel();
    const onMsg = () => emit();
    bc?.addEventListener('message', onMsg);
    window.addEventListener('storage', onMsg);
    return () => {
      bc?.removeEventListener('message', onMsg);
      window.removeEventListener('storage', onMsg);
    };
  }

  let unsub: (() => void) | null = null;
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (cancelled) return;
      unsub = onSnapshot(
        doc(getDb(), 'sessions', SESSION_ID),
        (snap) =>
          cb(normalize(snap.data({ serverTimestamps: 'estimate' })), {
            exists: snap.exists(),
            error: null,
            local: false,
          }),
        (err) => cb(DEFAULT_SESSION, { exists: false, error: err.message, local: false }),
      );
    })
    .catch((err: Error) => cb(DEFAULT_SESSION, { exists: false, error: err.message, local: false }));
  return () => {
    cancelled = true;
    unsub?.();
  };
}

/** startedAt: 'now' marca la hora de inicio (hora del servidor en Firestore). */
export type SessionPatch = Partial<Omit<SessionState, 'startedAt'>> & { startedAt?: 'now' | null };

export async function writeSession(current: SessionState, patch: SessionPatch): Promise<void> {
  const { startedAt, ...rest } = patch;
  const next = { ...current, ...rest };

  if (isLocalMode()) {
    const local: SessionState = {
      ...next,
      startedAt: startedAt === 'now' ? Date.now() : startedAt === null ? null : current.startedAt,
    };
    safeSet(LOCAL_STATE_KEY, JSON.stringify(local));
    channel()?.postMessage({ type: 'session' });
    window.dispatchEvent(new Event('storage'));
    return;
  }

  const { startedAt: _ignored, ...base } = next;
  void _ignored;
  const data: Record<string, unknown> = { ...base, updatedAt: serverTimestamp() };
  if (startedAt === 'now') data.startedAt = serverTimestamp();
  else if (startedAt === null) data.startedAt = null;
  else if (current.startedAt !== null) data.startedAt = Timestamp.fromMillis(current.startedAt);
  else data.startedAt = null;
  await setDoc(doc(getDb(), 'sessions', SESSION_ID), data);
}
