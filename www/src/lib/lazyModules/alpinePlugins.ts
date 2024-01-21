export const gatherPlugins = (pluginlist: CorePlugins[]) => {
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

export enum CorePlugins {
  Anchor = 1 << 0,
  Collapse = 1 << 1,
  Focus = 1 << 2,
  Intersect = 1 << 3,
  Mask = 1 << 4,
  Morph = 1 << 5,
  Persist = 1 << 6,
}
