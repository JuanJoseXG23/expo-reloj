import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { getDb, SESSION_ID } from '../firebase';
import { isLocalMode } from './sessionStore';

/** Borra todas las respuestas y participantes (solo expositores; lo exigen las reglas). */
export async function clearSessionData(): Promise<void> {
  if (isLocalMode()) return;
  const db = getDb();
  for (const sub of ['answers', 'participants']) {
    const snap = await getDocs(collection(db, 'sessions', SESSION_ID, sub));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      for (const d of snap.docs.slice(i, i + 450)) batch.delete(d.ref);
      await batch.commit();
    }
  }
}
