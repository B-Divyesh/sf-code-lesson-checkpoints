import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['frontend/src/**/*.test.ts', 'extension/src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
