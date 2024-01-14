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

export default async (config: Config) => {
  window.Alpine = Alpine;
  Alpine.plugin(await gatherPlugins(config));
  if (config.settings.tailwind) await loadTailwind();
  return Alpine;
};

type Config = {
  plugins: CorePlugins[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
  };
};

enum CorePlugins {
  Anchor = 'anchor',
  Collapse = 'collapse',
  Focus = 'focus',
  Intersect = 'intersect',
  Mask = 'mask',
  Morph = 'morph',
  Persist = 'persist',
}
