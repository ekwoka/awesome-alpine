import { base64 } from '@ekwoka/alpine-history';
import esbuild from 'esbuild-wasm';
import wasmURL from 'esbuild-wasm/esbuild.wasm?url';
import { CorePlugin } from './lazyModules/alpinePlugins';

let timeout: NodeJS.Timeout;
let initialized = false;
const debouncedBuild = (code: string) => {
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    if (!initialized)
      await esbuild.initialize({ wasmURL }).then(() => {
        initialized = true;
      });
    const esm = await esbuild.build({
      bundle: false,
      minify: true,
      write: false,
      stdin: {
        contents: code,
        sourcefile: 'index.ts',
      },
      format: 'esm',
      target: 'es2022',
    });
    console.log('esbuild output', esm);
    const output = esm.outputFiles?.[0].text;
    currentPromise.resolve?.({
      url: `data:application/javascript;base64,${base64.to(output)}`,
    });
    currentPromise.promise = null;
    currentPromise.resolve = null;
  }, 1000);
};

const currentPromise: {
  promise: Promise<ESModule> | null;
  resolve: ((value: ESModule) => void) | null;
} = {
  promise: null,
  resolve: null,
};

type ESModule = {
  url: string;
};

export const transpile = (
  code: string,
  config: EditorConfig,
): Promise<ESModule> => {
  currentPromise.promise ??= new Promise<ESModule>((res) => {
    currentPromise.resolve = res;
  });
  const codeWithPlugins = `
  import Alpine from '${esmUrl('alpinejs', config.settings.version)}';
  ${config.plugins
    .map(
      (plugin) =>
        `import ${CorePlugin[plugin]} from '${esmUrl(
          `@alpinejs/${CorePlugin[plugin].toLowerCase()}`,
          config.settings.version,
        )}';`,
    )
    .join('\n')}
  ${config.plugins
    .map((plugin) => `Alpine.plugin(${CorePlugin[plugin]});`)
    .join('\n')}

  ${code}

  export default Alpine;
  `;
  debouncedBuild(codeWithPlugins);
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

const esmUrl = (dep: string, version: `${number}.${number}.${number}`) =>
  `https://esm.sh/${dep}@${version}`;
