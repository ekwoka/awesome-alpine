const importFromESM = (
  name: string,
  version: `${number}.${number}.${number}`,
) => import(/* @vite-ignore */ `https://esm.sh/@alpinejs/${name}@${version}`);
export const gatherPlugins = (
  pluginlist: CorePlugin[],
  version: `${number}.${number}.${number}`,
) => {
  const plugins = pluginlist.map((plugin) => {
    switch (Number(plugin)) {
      case CorePlugin.Anchor:
        return importFromESM('anchor', version);
      case CorePlugin.Collapse:
        return importFromESM('collapse', version);
      case CorePlugin.Focus:
        return importFromESM('focus', version);
      case CorePlugin.Intersect:
        return importFromESM('intersect', version);
      case CorePlugin.Mask:
        return importFromESM('mask', version);
      case CorePlugin.Morph:
        return importFromESM('morph', version);
      case CorePlugin.Persist:
        return importFromESM('persist', version);
    }
    return Promise.resolve({ default: () => {} });
  });
  return Promise.all(plugins.map((plugin) => plugin.then((m) => m.default)));
};

export enum CorePlugin {
  Anchor = 1 << 0,
  Collapse = 1 << 1,
  Focus = 1 << 2,
  Intersect = 1 << 3,
  Mask = 1 << 4,
  Morph = 1 << 5,
  Persist = 1 << 6,
}
