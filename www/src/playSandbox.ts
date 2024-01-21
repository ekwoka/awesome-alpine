import { CorePlugins, gatherPlugins } from './lib/lazyModules/alpinePlugins';
import { loadTailwind } from './lib/lazyModules/tailwind';
import { RPCReceiver, RPCSender } from './lib/postmessageRPC';
import Alpine from 'alpinejs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

window.Alpine = Alpine;

export type Config = {
  plugins: CorePlugins[];
  settings: {
    typescript: boolean;
    tailwind: boolean;
  };
};

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
    console.log('starting Alpine');
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
