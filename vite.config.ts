/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export const myPlugin = () => {
  return {
    name: 'my-plugin',
    resolveId(id: string) {
      if (id.endsWith('?dlx')) {
        return id;
      }
    },
    async load(id: string) {
      if (id.endsWith('?dlx')) {
        const res = await fetch('https://' + id);
        return res.text();
      }
    },
  };
};

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    myPlugin() /* ExternalDeps(), WorkspaceSource() */,
  ],
  root: 'www/src',
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
        index: './www/src/index.html',
        play: './www/src/play.html',
        sandbox: './www/src/sandbox.html',
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
