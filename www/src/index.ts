import { prettify } from './lib';
import { CorePlugins } from './lib/lazyModules/alpinePlugins';
import { RPCReceiver, RPCSender } from './lib/postmessageRPC';
import { Language } from './lib/prettier';
import { sandboxActions } from './playSandbox';
import { bitwiseArray, booleanNumber } from './plugins/encoding';
import persist from '@alpinejs/persist';
import query, { base64URL } from '@ekwoka/alpine-history';
import Alpine from 'alpinejs';
import type { editor } from 'monaco-editor';

const makeEditor = () =>
  import('./lib/makeEditor.js').then((m) => m.makeEditor);

const transpile = () => import('./lib/transpile.js').then((m) => m.transpile);

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
    },
  },
  value: {
    html: Alpine.query(
      `<div
  x-data="example"
  x-text="text"
  class="text-xl uppercase !text-blue-300 flex justify-center items-center"
  style="color:white"
>
  This is the Editor
</div>`,
    )
      .encoding(base64URL)
      .as('html'),
    typescript: Alpine.query(
      `Alpine.data('example', () => ({
  text: 'I am the text now!',
}));`,
    )
      .encoding(base64URL)
      .as('script'),
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
        console.log('Adding Plugins');
        await this.sandbox.call.loadPlugins(Alpine.raw(this.config.plugins));
      }),
      effectPromise(async () => {
        await this.sandbox.call.evaluateScript(
          this.config.settings.typescript && this.value.typescript
            ? await (
                await transpile()
              )(this.value.typescript)
            : this.value.typescript,
        );
      }),
      effectPromise(async () => {
        await this.sandbox.call.replaceMarkup(this.value.html);
      }),
    ]);
    this.sandbox.call.start();
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

window.Alpine = Alpine;
Alpine.start();

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
