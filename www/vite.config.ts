/// <reference types="vitest" />
import { defineConfig } from 'vite';

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
  plugins: [DLX()],
  root: 'src',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  },
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
      input: {
        index: './src/templates/index.html',
        play: './src/templates/play.html',
        sandbox: './src/templates/sandbox.html',
        'hello.rs.html': './src/templates/hello.rs.html',
      },
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
