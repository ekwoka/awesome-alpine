/// <reference types="vitest" />
import posthtml from '@vituum/vite-plugin-posthtml';
import { defineConfig } from 'vite';
import vituum from 'vituum';

export const DLX = () => {
  return {
    name: 'dlx',
    resolveId(id: string) {
      if (id.includes('?dlx')) {
        return id;
      }
    },
    async load(id: string) {
      if (id.includes('?dlx')) {
        const res = await fetch('https://' + id);
        const text = await res.text();
        if (id.includes('&json'))
          return `export default JSON.parse(${JSON.stringify(text)})`;
        return text;
      }
    },
  };
};

export default defineConfig({
  root: './src',
  plugins: [
    DLX(),
    vituum({
      pages: {
        root: './',
        dir: './pages',
      },
    }),
    posthtml(),
  ],
  build: {
    assetsInlineLimit: 0,
    target: 'esnext',
    minify: false,
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      input: ['./pages/**/*.html'],
      output: {},
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
