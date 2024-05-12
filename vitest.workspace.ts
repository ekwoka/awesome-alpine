import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './vite.config.ts',
  './packages/htma/vite.config.ts',
  './packages/toasts/vite.config.ts',
  './www/vite.config.ts',
]);
