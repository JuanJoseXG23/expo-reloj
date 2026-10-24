import { useCallback, useEffect, useRef, useState } from 'react';
import { isLocalMode, subscribeSession, writeSession, type SessionMeta, type SessionPatch } from '../lib/sessionStore';
import { DEFAULT_SESSION, type SessionState } from '../lib/types';

/** Estado de la sesión en tiempo real (Firestore o modo local). */
export function useSession() {
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);
  const [meta, setMeta] = useState<SessionMeta>({ exists: false, error: null, local: isLocalMode() });
  const [loading, setLoading] = useState(true);
  const [modeVersion, setModeVersion] = useState(0);
  const latest = useRef(session);

  // Si alguien activa/desactiva el modo local, volvemos a suscribirnos.
  useEffect(() => {
    const bump = () => setModeVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'expo-modo-local') bump();
    };
    window.addEventListener('expo-mode', bump);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('expo-mode', bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    return subscribeSession((s, m) => {
      latest.current = s;
      setSession(s);
      setMeta(m);
      setLoading(false);
    });
  }, [modeVersion]);

  /** Aplica cambios sin bloquear la interfaz (Firestore actualiza la vista local al instante). */
  const update = useCallback((patch: SessionPatch) => {
    const prev = latest.current;
    const { startedAt, ...rest } = patch;
    latest.current = {
      ...prev,
      ...rest,
      startedAt: startedAt === 'now' ? Date.now() : startedAt === null ? null : prev.startedAt,
    };
    return writeSession(prev, patch).catch((e: Error) => {
      console.error('No se pudo actualizar la sesión', e);
      throw e;
    });
  }, []);

  return { session, meta, loading, update };
}
