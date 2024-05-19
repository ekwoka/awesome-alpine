import { url } from 'esm.sh/build?urlfollow';
import { CorePlugin } from './lazyModules/alpinePlugins';

const { build } = (await import(/* @vite-ignore */ url)) as {
  build: (input: string | BuildInput) => Promise<BuildOutput>;
};

let timeout: NodeJS.Timeout;
const debouncedBuild = (code: string, config: EditorConfig) => {
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    const esm = await build({
      code,
      source: code,
      loader: config.settings.typescript ? 'ts' : 'js',
      dependencies: {
        alpinejs: config.settings.version,
        ...config.plugins.reduce(
          (acc, plugin) => {
            acc[`@alpinejs/${CorePlugin[plugin].toLowerCase()}`] =
              config.settings.version;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    });
    currentPromise.resolve?.(esm);
    currentPromise.promise = null;
    currentPromise.resolve = null;
  }, 1000);
};

type BuildInput = {
  code: string;
  source: string;
  loader?: 'js' | 'jsx' | 'ts' | 'tsx';
  dependencies?: Record<string, string>;
  types?: string;
};

type BuildOutput = {
  id: string;
  url: string;
  bundleUrl: string;
};

const currentPromise: {
  promise: Promise<ESModule> | null;
  resolve: ((value: ESModule) => void) | null;
} = {
  promise: null,
  resolve: null,
};

type ESModule = {
  id: string;
  url: string;
  bundleUrl: string;
};

export const transpile = (
  code: string,
  config: EditorConfig,
): Promise<ESModule> => {
  currentPromise.promise ??= new Promise<ESModule>((res) => {
    currentPromise.resolve = res;
  });
  const codeWithPlugins = `
  import Alpine from 'alpinejs';
  ${config.plugins
    .map(
      (plugin) =>
        `import ${CorePlugin[plugin]} from '@alpinejs/${CorePlugin[
          plugin
        ].toLowerCase()}';`,
    )
    .join('\n')}
  ${config.plugins
    .map((plugin) => `Alpine.plugin(${CorePlugin[plugin]});`)
    .join('\n')}

  ${code}

  export default Alpine;
  `;
  debouncedBuild(codeWithPlugins, config);
  return currentPromise.promise;
};

type EditorConfig = {
  plugins: CorePlugin[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
    version: `${number}.${number}.${number}`;
  };
};
