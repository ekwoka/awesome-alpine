import { prettify } from '../lib';
import { CorePlugins } from '../lib/lazyModules/alpinePlugins';
import { RPCReceiver, RPCSender } from '../lib/postmessageRPC';
import { Language } from '../lib/prettier';
import type { sandboxActions } from '../play/playSandbox';
// @ts-expect-error - this is a raw template inmport
import starterHTML from '../play/starter.html?raw';
// @ts-expect-error - this is a raw template import
import starterScript from '../play/starter.js?raw';
import { bitwiseArray, booleanNumber } from '../plugins/encoding';
import persist from '@alpinejs/persist';
import query, { base64URL } from '@ekwoka/alpine-history';
import Alpine from 'alpinejs';
import type { editor } from 'monaco-editor';

const makeEditor = () =>
  import('../lib/makeEditor.js').then((m) => m.makeEditor);

const transpile = () => import('../lib/transpile.js').then((m) => m.transpile);

Alpine.plugin([persist, query]);
Alpine.data('editor', () => ({
  panel: Alpine.query('html'),
  config: {
    plugins: Alpine.query<CorePlugins[]>([])
      .as('coreplugins')
      .encoding(bitwiseArray),
    settings: {
      typescript: Alpine.query(false).as('ts').encoding(booleanNumber),
      tailwind: Alpine.query(false).as('tw').encoding(booleanNumber),
      version: Alpine.query<`${number}.${number}.${number}`>('3.13.5').as('v'),
    },
  },
  alpineVersions: [] as string[],
  value: {
    html: Alpine.query(starterHTML).encoding(base64URL).as('html'),
    typescript: Alpine.query(starterScript).encoding(base64URL).as('script'),
  },
  editor: {
    html: null as editor.IStandaloneCodeEditor,
    typescript: null as editor.IStandaloneCodeEditor,
  },
  sandbox: null as RPCSender<sandboxActions> | null,
  async registerEditor(el: HTMLElement, type: Language) {
    this.editor[type] = (await makeEditor())(el, this.value[type], type);
  },
  init() {
    console.log('Initializing Alpine');
    new RPCReceiver({
      registerSandbox: (event?: MessageEvent<undefined>) => {
        if (event?.source)
          this.initializeSandbox(
            new RPCSender<sandboxActions>(event.source as Window),
          );
        return true;
      },
    });
  },
  async initializeSandbox(sandbox: RPCSender<sandboxActions>) {
    this.sandbox = sandbox;
    console.log('initializing sandbox');
    this.sandbox.call.log('Hello from Alpine!');
    await Promise.all([
      effectPromise(async () => {
        console.log('Loading Tailwind');
        if (this.config.settings.tailwind)
          await this.sandbox.call.loadTailwind();
      }),
      effectPromise(async () => {
        JSON.stringify(this.config) &&
          this.value.typescript &&
          (await this.sandbox.call.loadScript(
            await (
              await transpile()
            )(this.value.typescript, this.config),
          ));
      }),
    ]);
    await effectPromise(async () => {
      await this.sandbox.call.replaceMarkup(this.value.html);
    }),
      this.sandbox.call.start();
    const alpineRegistry = await import(
      'registry.npmjs.com/alpinejs?dlx&json'
    ).then((mod) => mod.default);
    console.log(alpineRegistry);
    this.alpineVersions = Object.keys(alpineRegistry.versions).reverse();
  },
  async prettify() {
    for (const type of [Language.HTML, Language.TYPESCRIPT]) {
      this.value[type] = await prettify(this.value[type], type as Language);
      Alpine.raw(await this.editor[type])?.setValue(this.value[type]);
    }
  },
  async update(type: Language.HTML | Language.TYPESCRIPT) {
    const content = Alpine.raw<(typeof this.editor)[typeof type]>(
      this.editor[type],
    )?.getValue();
    this.value[type] = await prettify(content, type);
  },
  CorePlugins: Object.entries(CorePlugins).filter(([key]) => isNaN(+key)),
}));

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

declare global {
  interface Window {
    sandbox: Window;
  }
}

const effectPromise = (fn: () => Promise<void>) =>
  new Promise<void>((res) => {
    Alpine.effect(async () => {
      await fn();
      res();
    });
  });
