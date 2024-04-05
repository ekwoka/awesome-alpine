/// <reference types="vitest" />
import { alpineTestingPlugin } from 'testing-library-alpine';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [alpineTestingPlugin()],
  build: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['typescript', 'import', 'module', 'browser', 'default'],
  },
  test: {
    globals: true,
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    deps: {},
  },
});
