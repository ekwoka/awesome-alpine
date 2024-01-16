import { RPCReceiver, RPCSender } from './lib/postmessageRPC';
import Alpine from 'alpinejs';

const gatherPlugins = (pluginlist: CorePlugins[]) => {
  const plugins = pluginlist.map((plugin) => {
    switch (Number(plugin)) {
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
    return Promise.resolve({ default: () => {} });
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
  Anchor = 1 << 0,
  Collapse = 1 << 1,
  Focus = 1 << 2,
  Intersect = 1 << 3,
  Mask = 1 << 4,
  Morph = 1 << 5,
  Persist = 1 << 6,
}

let started = false;
const resetAlpine = () => {
  if (!started) return;
  console.log('restarting alpine in sandbox');
  Alpine.destroyTree(document.body);
  Alpine.initTree(document.body);
};
const actions = {
  log: (message: string) => console.log(message),
  loadTailwind: async () => {
    await loadTailwind();
    document.body.replaceChildren(...document.body.children);
  },
  removeTailwind: () => window.location.reload(),
  start: () => {
    started = true;
    Alpine.start();
  },
  loadPlugins: async (plugins: CorePlugins[]) => {
    console.log('Loading plugins');
    Alpine.plugin(await gatherPlugins(plugins));
    resetAlpine();
  },
  evaluateScript: async (plugin: string) => {
    console.log('Evaluating script');
    await new AsyncFunction('Alpine', plugin)(Alpine);
    resetAlpine();
  },
  replaceMarkup: (markup: string) => {
    console.log('Replacing markup');

    Alpine.mutateDom(() => {
      document.body.replaceChildren(
        document.createRange().createContextualFragment(markup),
      );
    });
    resetAlpine();
  },
};

export type sandboxActions = typeof actions;

new RPCReceiver(actions);

// eslint-disable-next-line no-constant-condition
while (true) {
  console.log('Trying to register sandbox');
  if (
    (await new RPCSender<{ registerSandbox: () => void }>(self.top).call
      .registerSandbox()
      .wait(1000)) !== undefined
  )
    break;
}
