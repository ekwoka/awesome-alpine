import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
/// <reference types="vitest" />
import { AlpinePackageData } from './src/plugins/vite/AlpinePackageData';
import { DLX, URL } from './src/plugins/vite/DLX';

export default defineConfig({
  plugins: [DLX(), URL(), AlpinePackageData(), tailwindcss()],
  resolve: {
    conditions: ['typescript', 'import', 'module', 'browser', 'default'],
  },
  build: {
    assetsInlineLimit: 0,
    target: 'esnext',
    minify: true,
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
    cors: {
      origin: 'null',
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    pool: 'threads',
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    mockReset: true,
    restoreMocks: true,
    deps: {},
  },
});
