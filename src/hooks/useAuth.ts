import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ensureAuth, firebaseConfigured } from '../firebase';

/** Sesión anónima invisible. `user` es null mientras se conecta o si no hay internet. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(firebaseConfigured ? null : 'sin-config');

  useEffect(() => {
    if (!firebaseConfigured) return;
    let alive = true;
    ensureAuth()
      .then((u) => alive && setUser(u))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return { user, error };
}
