/// <reference types="vitest" />
import { resolve } from 'node:path';
import { alpineTestingPlugin } from 'testing-library-alpine';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import ExternalDeps from 'vite-plugin-external-deps';

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    conditions: ['typescript', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    alpineTestingPlugin(),
    dts({
      entryRoot: resolve(__dirname, 'src'),
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
    }),
    ExternalDeps(),
  ],
  define: {
    'import.meta.vitest': 'undefined',
  },
  build: {
    target: 'esnext',
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['es'],
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: ({ name: fileName }) => {
          return `${fileName}.js`;
        },
      },
      external: [/node_modules/],
    },
  },
  test: {
    globals: true,
    pool: 'threads',
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    deps: {},
    passWithNoTests: true,
  },
});
