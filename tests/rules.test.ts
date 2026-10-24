// Pruebas de las reglas de Firestore con el emulador.
// Ejecutar con: npm run test:reglas  (necesita Java 21+ y firebase-tools)
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

const KEY = 'ADMIN123';
const SID = 'expo-reloj';
let env: RulesTestEnvironment;

const baseSession = {
  status: 'live',
  unlockedBlocks: [0],
  currentBlock: 0,
  currentSlide: 0,
  currentSpeaker: 'Juan José',
  activeQuizId: null,
  quizState: 'idle',
  showRanking: false,
  ranking: [],
  startedAt: null,
};

function db(uid: string | null) {
  return uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
}

async function seed(session: Record<string, unknown> = baseSession) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    await setDoc(doc(fs, 'config/secret'), { presenterKey: KEY });
    await setDoc(doc(fs, 'presenters/profe'), { name: 'Juan José', key: KEY });
    await setDoc(doc(fs, `sessions/${SID}`), session);
  });
}

function answer(uid: string, quizId: string, option = 1) {
  return { uid, name: 'Ana', quizId, option, correct: false, answeredAt: serverTimestamp() };
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-expo-reloj',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

describe('autenticación', () => {
  it('sin sesión anónima no se puede leer nada', async () => {
    await assertFails(getDoc(doc(db(null), `sessions/${SID}`)));
  });
});

describe('config/secret', () => {
  it('nadie la puede leer, ni siquiera un expositor', async () => {
    await assertFails(getDoc(doc(db('estudiante'), 'config/secret')));
    await assertFails(getDoc(doc(db('profe'), 'config/secret')));
  });
  it('nadie la puede escribir', async () => {
    await assertFails(setDoc(doc(db('profe'), 'config/secret'), { presenterKey: 'x' }));
  });
});

describe('presenters', () => {
  it('clave incorrecta NO crea expositor', async () => {
    await assertFails(setDoc(doc(db('pepe'), 'presenters/pepe'), { name: 'Pepe', key: 'adivino' }));
  });
  it('clave correcta sí crea expositor', async () => {
    await assertSucceeds(setDoc(doc(db('renzo'), 'presenters/renzo'), { name: 'Renzo', key: KEY, createdAt: serverTimestamp() }));
  });
  it('no se puede crear el documento de otro', async () => {
    await assertFails(setDoc(doc(db('pepe'), 'presenters/otro'), { name: 'Pepe', key: KEY }));
  });
  it('no se aceptan campos extra', async () => {
    await assertFails(setDoc(doc(db('pepe'), 'presenters/pepe'), { name: 'Pepe', key: KEY, admin: true }));
  });
  it('un estudiante no puede leer expositores; el propio sí', async () => {
    await assertFails(getDoc(doc(db('estudiante'), 'presenters/profe')));
    await assertSucceeds(getDoc(doc(db('profe'), 'presenters/profe')));
    await assertFails(getDocs(collection(db('profe'), 'presenters')));
  });
  it('no se puede editar ni borrar', async () => {
    await assertFails(updateDoc(doc(db('profe'), 'presenters/profe'), { name: 'X' }));
    await assertFails(deleteDoc(doc(db('profe'), 'presenters/profe')));
  });
});

describe('sessions', () => {
  it('cualquiera autenticado la lee', async () => {
    await assertSucceeds(getDoc(doc(db('estudiante'), `sessions/${SID}`)));
  });
  it('un estudiante NO puede controlar la sesión (desbloquear bloques)', async () => {
    await assertFails(setDoc(doc(db('estudiante'), `sessions/${SID}`), { ...baseSession, unlockedBlocks: [0, 1, 2, 3, 4] }));
    await assertFails(updateDoc(doc(db('estudiante'), `sessions/${SID}`), { currentBlock: 3 }));
  });
  it('el expositor sí la controla', async () => {
    await assertSucceeds(setDoc(doc(db('profe'), `sessions/${SID}`), { ...baseSession, currentBlock: 1, updatedAt: serverTimestamp() }));
  });
  it('el expositor no puede escribir valores inválidos', async () => {
    await assertFails(setDoc(doc(db('profe'), `sessions/${SID}`), { ...baseSession, status: 'hackeado' }));
    await assertFails(setDoc(doc(db('profe'), `sessions/${SID}`), { ...baseSession, extra: 1 }));
  });
});

describe('participants', () => {
  const p = () => ({ name: 'Ana', joinedAt: serverTimestamp(), lastSeen: serverTimestamp() });
  it('cada quien escribe el suyo', async () => {
    await assertSucceeds(setDoc(doc(db('ana'), `sessions/${SID}/participants/ana`), p()));
  });
  it('no puede escribir el de otro', async () => {
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/participants/beto`), p()));
  });
  it('nombre con HTML o muy corto se rechaza', async () => {
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/participants/ana`), { ...p(), name: '<b>x</b>' }));
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/participants/ana`), { ...p(), name: 'A' }));
  });
  it('todos pueden leer la lista', async () => {
    await assertSucceeds(getDocs(collection(db('beto'), `sessions/${SID}/participants`)));
  });
});

describe('answers', () => {
  const open = { ...baseSession, activeQuizId: 'b1-tic', quizState: 'open' };

  it('puede responder la pregunta abierta, con su propio id', async () => {
    await seed(open);
    await assertSucceeds(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic')));
    // y cambiarla mientras siga abierta
    await assertSucceeds(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic', 2)));
  });
  it('no puede responder si la pregunta está cerrada', async () => {
    await seed({ ...open, quizState: 'closed' });
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic')));
  });
  it('no puede responder otra pregunta distinta a la activa', async () => {
    await seed(open);
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/answers/final_ana`), answer('ana', 'final')));
  });
  it('no puede responder por otro', async () => {
    await seed(open);
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_beto`), answer('beto', 'b1-tic')));
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_beto`), answer('ana', 'b1-tic')));
  });
  it('opción fuera de rango se rechaza', async () => {
    await seed(open);
    await assertFails(setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic', 7)));
  });
  it('lee la suya siempre, la de otros solo en resultados', async () => {
    await seed(open);
    await setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic'));
    await assertSucceeds(getDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`)));
    await assertFails(getDoc(doc(db('beto'), `sessions/${SID}/answers/b1-tic_ana`)));
    const q = query(collection(db('beto'), `sessions/${SID}/answers`), where('quizId', '==', 'b1-tic'));
    await assertFails(getDocs(q));

    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), `sessions/${SID}`), { quizState: 'results' }),
    );
    await assertSucceeds(getDoc(doc(db('beto'), `sessions/${SID}/answers/b1-tic_ana`)));
    await assertSucceeds(getDocs(q));
  });
  it('el expositor lee y borra todo; el estudiante no borra', async () => {
    await seed(open);
    await setDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`), answer('ana', 'b1-tic'));
    await assertSucceeds(getDocs(collection(db('profe'), `sessions/${SID}/answers`)));
    await assertFails(deleteDoc(doc(db('ana'), `sessions/${SID}/answers/b1-tic_ana`)));
    await assertSucceeds(deleteDoc(doc(db('profe'), `sessions/${SID}/answers/b1-tic_ana`)));
  });
});
