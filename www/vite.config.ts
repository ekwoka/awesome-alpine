/// <reference types="vitest" />
import { CorePlugin } from './src/lib/lazyModules/alpinePlugins';
import posthtml from '@vituum/vite-plugin-posthtml';
import expressions from 'posthtml-expressions';
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
const minimumVersion = '3.11.0'.split('.').map(Number);
const pkgVersions = Object.fromEntries(
  packages.map((pkg) => [
    pkg.name,
    Object.keys(pkg.versions)
      .map((version) => version.split('.').map(Number))
      .filter((version) => {
        if (version[0] > minimumVersion[0]) return true;
        if (version[0] < minimumVersion[0]) return false;
        if (version[1] > minimumVersion[1]) return true;
        if (version[1] < minimumVersion[1]) return false;
        if (version[2] >= minimumVersion[2]) return true;
        return false;
      })
      .map((version) => version.join('.'))
      .reverse(),
  ]),
);

export const AlpinePackageData = () => ({
  name: 'alpine-versions',
  resolveId(id: string) {
    if (id === 'alpine-versions') {
      return id;
    }
  },
  load(id: string) {
    if (id === 'alpine-versions') {
      return `export default ${JSON.stringify(pkgVersions)}`;
    }
  },
});

export default defineConfig({
  plugins: [
    DLX(),
    vituum(),
    posthtml({
      root: './src',
      plugins: [
        expressions({
          removeScriptLocals: true,
          locals: {
            alpineVersions: pkgVersions,
            CorePlugins: Object.entries(CorePlugin).filter(([key]) =>
              isNaN(+key),
            ) as [string, CorePlugin][],
          },
        }),
      ],
    }),
    AlpinePackageData(),
  ],
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
