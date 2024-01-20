import { RPCReceiver, RPCSender } from './lib/postmessageRPC';
import Alpine from 'alpinejs';

const gatherPlugins = (pluginList: CorePlugins[]) => {
  const plugins = pluginList.map((plugin) => {
    switch (plugin) {
      case CorePlugins.Anchor:
        return import('@alpinejs/anchor');
      case CorePlugins.Collapse:
        return import('@alpinejs/collapse');
      case CorePlugins.Focus:
        return import('@alpinejs/focus');
      case CorePlugins.Intersect:
        return import('@alpinejs/intersect');
      case CorePlugins.Mask:
        return import('@alpinejs/mask');
      case CorePlugins.Morph:
        return import('@alpinejs/morph');
      case CorePlugins.Persist:
        return import('@alpinejs/persist');
    }
  });
  return Promise.all(plugins.map((plugin) => plugin.then((m) => m.default)));
};

const loadTailwind = () => import('cdn.tailwindcss.com/3.4.1?dlx');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
window.Alpine = Alpine;
export const setup = async (config: Config) => {
  Alpine.plugin(await gatherPlugins(config.plugins));
  if (config.settings.tailwind) await loadTailwind();
  return Alpine;
};

export type Config = {
  plugins: CorePlugins[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
  };
};

export enum CorePlugins {
  Anchor = 'anchor',
  Collapse = 'collapse',
  Focus = 'focus',
  Intersect = 'intersect',
  Mask = 'mask',
  Morph = 'morph',
  Persist = 'persist',
}

const actions = {
  log: (message: string) => console.log(message),
  loadTailwind: async () => {
    await loadTailwind();
  },
  removeTailwind: () => window.location.reload(),
  start: () => Alpine.start(),
  loadPlugins: async (plugins: CorePlugins[]) => {
    console.log('Loading plugins');
    Alpine.plugin(await gatherPlugins(plugins));
  },
  evaluateScript: async (plugin: string) => {
    console.log('Evaluating script');
    await new AsyncFunction('Alpine', plugin)(Alpine);
  },
  replaceMarkup: (markup: string) => {
    console.log('Replacing markup');
    document.body.replaceChildren(
      document.createRange().createContextualFragment(markup),
    );
  },
};

export type sandboxActions = typeof actions;

new RPCReceiver(actions);

// eslint-disable-next-line no-constant-condition
while (true) {
  if (
    (await new RPCSender<{ registerSandbox: () => void }>(self.top).call
      .registerSandbox()
      .wait(1000)) === undefined
  )
    break;
}
