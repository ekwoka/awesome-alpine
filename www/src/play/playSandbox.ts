import { CorePlugin, gatherPlugins } from '../lib/lazyModules/alpinePlugins';
import { loadTailwind } from '../lib/lazyModules/tailwind';
import { RPCReceiver, RPCSender } from '../lib/postmessageRPC';
import versionData from 'alpine-versions';
import type { Alpine as IAlpine } from 'alpinejs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export type Config = {
  plugins: CorePlugin[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
  };
};

const state: {
  version: null | `${number}.${number}.${number}`;
  alpineStarted: boolean;
  tailwindLoaded: boolean;
  Alpine: IAlpine | null;
} = {
  version: null,
  alpineStarted: false,
  tailwindLoaded: false,
  Alpine: null,
};
const resetAlpine = () => {
  if (!state.alpineStarted) return;
  console.log('restarting alpine in sandbox');
  state.Alpine.destroyTree(document.body);
  state.Alpine.initTree(document.body);
};
const actions = {
  log: (message: string) => console.log(message),
  loadAlpine: async (version: `${number}.${number}.${number}`) => {
    if (state.version === version) return;
    if (state.version !== null) return window.location.reload();
    state.version = version;
    console.log('importing version', version);
    state.Alpine = window.Alpine = await import(
      /* @vite-ignore */ `https://esm.sh/alpinejs@${version}`
    ).then((mod) => mod.default);
    console.log('Alpine loaded');
    console.log(state.Alpine);
  },
  loadTailwind: async () => {
    await loadTailwind();
    document.body.replaceChildren(...document.body.children);
    state.tailwindLoaded = true;
  },
  removeTailwind: () => state.tailwindLoaded && window.location.reload(),
  start: () => {
    console.log('starting Alpine');
    state.alpineStarted = true;
    state.Alpine.start();
  },
  loadPlugins: async (plugins: CorePlugin[]) => {
    console.log('Loading plugins');
    state.Alpine.plugin(await gatherPlugins(plugins, state.version));
    resetAlpine();
  },
  evaluateScript: async (plugin: string) => {
    console.log('Evaluating script');
    await new AsyncFunction('Alpine', plugin)(state.Alpine);
    resetAlpine();
  },
  replaceMarkup: (markup: string) => {
    console.log('Replacing markup');

    state.Alpine?.destroyTree(document.body);
    state.Alpine?.stopObservingMutations();
    document.body.replaceChildren(
      document.createRange().createContextualFragment(markup),
    );
    if (!state.alpineStarted) return;
    state.Alpine.startObservingMutations();
    state.Alpine.initTree(document.body);
  },
  loadScript: async (script: {
    id: string;
    url: string;
    bundleUrl: string;
  }) => {
    state.Alpine?.destroyTree(document.body);
    state.Alpine?.stopObservingMutations();
    state.Alpine = await import(/* vite-ignore */ script.url).then(
      (mod) => mod.default,
    );
    if (!state.alpineStarted) return;
    state.Alpine.startObservingMutations();
    state.Alpine.initTree(document.body);
  },
};

export type sandboxActions = typeof actions;

new RPCReceiver(actions);

let count = 0;
// eslint-disable-next-line no-constant-condition
while (count++ < 100) {
  console.log('Trying to register sandbox');
  if (
    (await new RPCSender<{ registerSandbox: () => void }>(
      self.top as Window,
    ).call
      .registerSandbox()
      .wait(1000)) !== undefined
  )
    break;
}
