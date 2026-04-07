import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@scxfe/api-tool': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.{test}.ts', 'src/**/__tests__/**/*.test.ts', 'src/**/__tests__/*.ts'],
    exclude: ['src/service/**/*', 'src/templates/**/*'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    include: ['src/**/*.ts'],
    exclude: ['src/service/**/*', 'src/templates/**/*', 'src/**/index.ts'],
    thresholds: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
});
