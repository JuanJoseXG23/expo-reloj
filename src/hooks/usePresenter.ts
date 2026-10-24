import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ensureAuth, firebaseConfigured, getDb } from '../firebase';

const OK_KEY = 'expo-expositor-ok';

export type PresenterStatus = 'checking' | 'yes' | 'no';

function rememberOk(ok: boolean) {
  try {
    if (ok) localStorage.setItem(OK_KEY, '1');
    else localStorage.removeItem(OK_KEY);
  } catch {
    /* nada */
  }
}

function wasOk(): boolean {
  try {
    return localStorage.getItem(OK_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Intenta registrarse como expositor con la clave.
 * La app NO conoce la clave: solo crea presenters/{uid} y las reglas lo aceptan
 * si coincide con config/secret. Si no coincide, Firestore lo rechaza.
 */
export async function tryPresenterKey(key: string, name: string): Promise<boolean> {
  const user = await ensureAuth();
  const ref = doc(getDb(), 'presenters', user.uid);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      // Ya era expositor: solo aceptamos si escribió la misma clave con la que se validó
      // (así un expositor que escribe su nombre normal en "Entrar" va a la sala como estudiante).
      const ok = existing.data().key === key;
      if (ok) rememberOk(true);
      return ok;
    }
  } catch {
    /* seguimos e intentamos crear */
  }
  try {
    await setDoc(ref, { name: name.slice(0, 40), key, createdAt: serverTimestamp() });
    rememberOk(true);
    return true;
  } catch {
    return false;
  }
}

/** ¿Este dispositivo ya es expositor? */
export function usePresenter() {
  const [status, setStatus] = useState<PresenterStatus>(firebaseConfigured ? 'checking' : 'yes');

  useEffect(() => {
    // Sin Firebase configurado solo existe el modo local.
    if (!firebaseConfigured) return;
    let alive = true;
    // Sin internet: si este dispositivo ya se validó antes, dejamos pasar (plan B).
    const timeout = window.setTimeout(() => {
      if (alive && wasOk()) setStatus('yes');
    }, 4000);
    ensureAuth()
      .then((u) => getDoc(doc(getDb(), 'presenters', u.uid)))
      .then((snap) => {
        if (!alive) return;
        rememberOk(snap.exists());
        setStatus(snap.exists() ? 'yes' : 'no');
      })
      .catch(() => {
        if (alive) setStatus(wasOk() ? 'yes' : 'no');
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const validate = useCallback(async (key: string, name: string) => {
    const ok = await tryPresenterKey(key, name);
    if (ok) setStatus('yes');
    return ok;
  }, []);

  return { status, validate };
}
