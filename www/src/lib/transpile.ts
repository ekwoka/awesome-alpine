import { CorePlugins } from './lazyModules/alpinePlugins';
import { build } from 'https://esm.sh/build';

declare module 'https://esm.sh/build' {
  export type BuildInput = {
    source: string;
    loader?: 'js' | 'jsx' | 'ts' | 'tsx';
    dependencies?: Record<string, string>;
    types?: string;
  };

  export type TransformOptions = {
    target?:
      | 'deno'
      | 'denonext'
      | 'node'
      | 'esnext'
      | `es201${5 | 6 | 7 | 8 | 9}`
      | `es202${0 | 1 | 2}`;
    imports?: Record<string, string>;
  };

  export type BuildOutput = {
    id: string;
    url: string;
    bundleUrl: string;
  };
  export const build: (input: string | BuildInput) => Promise<BuildOutput>;
}

export const transpile = async (
  code: string,
  config: EditorConfig,
): Promise<{
  id: string;
  url: string;
  bundleUrl: string;
}> => {
  const codeWithPlugins = `
  import Alpine from 'alpinejs';
  ${config.plugins.map((plugin) => `import ${CorePlugins[plugin]} from '@alpinejs/${CorePlugins[plugin].toLowerCase()}';`).join('\n')}
  ${config.plugins.map((plugin) => `Alpine.plugin(${CorePlugins[plugin]});`).join('\n')}

  ${code}

  export default Alpine;
  `;
  return await build({
    code: codeWithPlugins,
    loader: config.settings.typescript ? 'ts' : 'js',
    dependencies: {
      alpinejs: config.settings.version,
      ...config.plugins.reduce(
        (acc, plugin) => {
          acc[`@alpinejs/${CorePlugins[plugin].toLowerCase()}`] =
            config.settings.version;
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
  });
};

type EditorConfig = {
  plugins: CorePlugins[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
    version: `${number}.${number}.${number}`;
  };
};
