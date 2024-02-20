/// <reference types="vitest" />
import posthtml from '@vituum/vite-plugin-posthtml';
import { defineConfig } from 'vite';
import vituum from 'vituum';

export const DLX = () => ({
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
});
const NPM = 'https://registry.npmjs.com/';
export const AlpinePackageData = () => ({
  name: 'alpine-versions',
  resolveId(id: string) {
    if (id === 'alpine-versions') {
      return id;
    }
  },
  async load(id: string) {
    if (id === 'alpine-versions') {
      const packages = await Promise.all(
        [
          'alpinejs',
          '@alpinejs/morph',
          '@alpinejs/persist',
          '@alpinejs/mask',
          '@alpinejs/intersect',
          '@alpinejs/focus',
          '@alpinejs/collapse',
          '@alpinejs/anchor',
        ].map(async (pkg) => {
          const res = await fetch(NPM + pkg);
          return res.json();
        }),
      );
      const pkgVersions = Object.fromEntries(
        packages.map((pkg) => [
          pkg.name,
          Object.keys(pkg.versions)
            .filter((version) => version.startsWith('3.'))
            .reverse(),
        ]),
      );
      return `export default ${JSON.stringify(pkgVersions)}`;
    }
  },
});

export default defineConfig({
  plugins: [DLX(), vituum(), posthtml({ root: './src' }), AlpinePackageData()],
  build: {
    assetsInlineLimit: 0,
    target: 'esnext',
    minify: false,
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
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
