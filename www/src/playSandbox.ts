import { RPCReceiver } from './postmessageRPC';
import Alpine from 'alpinejs';

const gatherPlugins = (config: Config) => {
  const plugins = config.plugins.map((plugin) => {
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

window.Alpine = Alpine;
export const setup = async (config: Config) => {
  Alpine.plugin(await gatherPlugins(config));
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
  loadTailwind: () => loadTailwind(),
  removeTailwind: () => window.location.reload(),
  start: () => Alpine.start(),
  loadPlugins: async (config: Config) =>
    Alpine.plugin(await gatherPlugins(config)),
  evaluateScript: (plugin: string) => new Function('Alpine', plugin)(Alpine),
  replaceMarkup: (markup: string) => {
    document.body.replaceChildren(
      document.createRange().createContextualFragment(markup),
    );
  },
};

export type sandboxActions = typeof actions;

new RPCReceiver(actions);

window.top.postMessage({ type: 'sandbox-loaded' }, '*');
