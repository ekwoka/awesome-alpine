import type { Plugin } from 'vite';
import { cache } from './cache';
const NPM = 'https://registry.npmjs.com/';

const MIN_VERSION = '3.11.0';
const EXCLUDED_VERSIONS = [
  '3.13.6',
  '3.14.5',
  '3.14.6',
  '3.14.7',
] as SEMVER<string>[];
const ALPINE_PACKAGES = [
  'alpinejs',
  '@alpinejs/morph',
  '@alpinejs/persist',
  '@alpinejs/mask',
  '@alpinejs/intersect',
  '@alpinejs/focus',
  '@alpinejs/collapse',
  '@alpinejs/anchor',
  '@alpinejs/sort',
];

const getPackageData = async (): Promise<PackageInfo[]> => {
  const packages = await Promise.all(
    ALPINE_PACKAGES.map(async (pkg) => {
      try {
        const cached = await cache.get(pkg);
        return JSON.parse(cached) as PackageInfo;
      } catch (_) {
        // Ignore cache errors
      }
      try {
        const res = await fetch(NPM + pkg);
        if (!res.ok) return null;
        const result = (await res.json()) as PackageInfo;
        await cache.set(pkg, JSON.stringify(result));
        return result;
      } catch (e) {
        console.error(e);
        console.error('failed to fetch package data for', pkg);
        return null;
      }
    }),
  );
  return packages.filter((pkg): pkg is PackageInfo => Boolean(pkg));
};
const toVersionArray = (version: SEMVER<string>): SEMVER<number> =>
  version.split('.').map(Number) as [number, number, number];

export const AlpinePackageData = (): Plugin => ({
  name: 'alpine-versions',
  resolveId(id: string) {
    if (['./alpine-versions', 'alpine-versions'].includes(id)) {
      return id;
    }
  },
  async load(id: string) {
    if (!['./alpine-versions', 'alpine-versions'].includes(id)) return;
    console.log('Getting Alpine Package Data...');
    const packages = await getPackageData();
    const pkgVersions = Object.fromEntries(
      packages.map((pkg) => [
        pkg.name,
        (Object.keys(pkg.versions) as SEMVER<string>[])
          .filter(out(EXCLUDED_VERSIONS))
          .map(toVersionArray)
          .filter(newerThan(MIN_VERSION))
          .map((version) => version.join('.'))
          .reverse(),
      ]),
    );
    return `export default ${JSON.stringify(pkgVersions)}`;
  },
});

const newerThan = (minimum: SEMVER<string>) => {
  const minimumVersion = toVersionArray(minimum);
  const [minMaj, minMin, minPatch] = minimumVersion;
  return (version: SEMVER<number>) => {
    if (version[0] > minMaj) return true;
    if (version[0] < minMaj) return false;
    if (version[1] > minMin) return true;
    if (version[1] < minMin) return false;
    if (version[2] >= minPatch) return true;
    return false;
  };
};

const out = (excluded: SEMVER<string>[]) => (version: SEMVER<string>) =>
  !excluded.includes(version);

type SEMVER<T extends string | number> = T extends string
  ? `${number}.${number}.${number}`
  : [major: number, minor: number, patch: number];

type PackageInfo = {
  name: string;
  versions: Record<SEMVER<string>, string>;
};
