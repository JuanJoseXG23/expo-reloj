import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { getDb, SESSION_ID } from '../firebase';
import { isLocalMode } from '../lib/sessionStore';
import type { Participant } from '../lib/types';

const HEARTBEAT_MS = 30_000;
const ONLINE_MS = 75_000;

/** Latido cada 30 s para que el panel sepa quién está conectado. */
export function usePresence(uid: string | null, name: string | null) {
  useEffect(() => {
    if (!uid || !name || isLocalMode()) return;
    const ref = doc(getDb(), 'sessions', SESSION_ID, 'participants', uid);
    const beat = () => {
      // joinedAt se reescribe en cada latido: así sobrevive a un "Reiniciar" del panel.
      setDoc(ref, { name, joinedAt: serverTimestamp(), lastSeen: serverTimestamp() }).catch((e) =>
        console.warn('Latido falló', e),
      );
    };
    beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [uid, name]);
}

/** Lista de conectados (latido en los últimos 75 s). */
export function useParticipants(enabled: boolean) {
  const [all, setAll] = useState<Participant[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!enabled || isLocalMode()) return;
    const unsub = onSnapshot(
      collection(getDb(), 'sessions', SESSION_ID, 'participants'),
      (snap) =>
        setAll(
          snap.docs.map((d) => {
            const data = d.data({ serverTimestamps: 'estimate' });
            return {
              uid: d.id,
              name: String(data.name ?? ''),
              lastSeen: data.lastSeen instanceof Timestamp ? data.lastSeen.toMillis() : Date.now(),
            };
          }),
        ),
      (e) => console.warn('No se pudo leer participantes', e),
    );
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      unsub();
      window.clearInterval(id);
    };
  }, [enabled]);

  const online = all
    .filter((p) => now - p.lastSeen < ONLINE_MS)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return { online };
}
