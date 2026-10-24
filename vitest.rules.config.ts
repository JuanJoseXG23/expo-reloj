import { defineConfig } from 'vitest/config';

// Pruebas de reglas: se ejecutan con `npm run test:reglas` (requiere el emulador).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
