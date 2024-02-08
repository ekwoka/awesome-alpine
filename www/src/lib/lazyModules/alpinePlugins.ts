const importFromESM = (
  name: string,
  version: `${number}.${number}.${number}`,
) => import(/* @vite-ignore */ `https://esm.sh/@alpinejs/${name}@${version}`);
export const gatherPlugins = (
  pluginlist: CorePlugins[],
  version: `${number}.${number}.${number}`,
) => {
  const plugins = pluginlist.map((plugin) => {
    switch (Number(plugin)) {
      case CorePlugins.Anchor:
        return importFromESM('anchor', version);
      case CorePlugins.Collapse:
        return importFromESM('collapse', version);
      case CorePlugins.Focus:
        return importFromESM('focus', version);
      case CorePlugins.Intersect:
        return importFromESM('intersect', version);
      case CorePlugins.Mask:
        return importFromESM('mask', version);
      case CorePlugins.Morph:
        return importFromESM('morph', version);
      case CorePlugins.Persist:
        return importFromESM('persist', version);
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
