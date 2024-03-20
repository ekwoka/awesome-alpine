/// <reference types="vitest" />
import { AlpinePackageData } from './src/plugins/vite/AlpinePackageData';
import { DLX, URL } from './src/plugins/vite/DLX';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [DLX(), URL(), AlpinePackageData()],
  build: {
    assetsInlineLimit: 0,
    target: 'esnext',
    minify: false,
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
  },
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    mockReset: true,
    restoreMocks: true,
    deps: {},
  },
});
