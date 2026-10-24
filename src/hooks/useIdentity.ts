import { useCallback, useState } from 'react';

const KEY = 'expo-nombre';

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Limpia el nombre: sin HTML, espacios normalizados. */
export function cleanName(raw: string): string {
  return raw.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 40;
}

/** Nombre del estudiante guardado en este dispositivo (lo único que guardamos). */
export function useIdentity() {
  const [name, setNameState] = useState<string | null>(read);

  const setName = useCallback((n: string) => {
    try {
      localStorage.setItem(KEY, n);
    } catch {
      /* sin almacenamiento: vale solo para esta visita */
    }
    setNameState(n);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nada */
    }
    setNameState(null);
  }, []);

  return { name, setName, clear };
}
