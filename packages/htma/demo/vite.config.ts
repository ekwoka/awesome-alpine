/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['typescript', 'import', 'module', 'browser', 'default'],
  },
});
