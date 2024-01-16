import { prettify } from './lib';
import { RPCReceiver, RPCSender } from './lib/postmessageRPC';
import { Language } from './lib/prettier';
import { CorePlugins, sandboxActions } from './playSandbox';
import persist from '@alpinejs/persist';
import query, { Encoding, base64URL } from '@ekwoka/alpine-history';
import Alpine from 'alpinejs';
import type { editor } from 'monaco-editor';

console.log('Hello from the playground!');

const makeEditor = () =>
  import('./lib/makeEditor.js').then((m) => m.makeEditor);

const transpile = () => import('./lib/transpile.js').then((m) => m.transpile);

const bitwiseArray: Encoding<number[]> = {
  to: (val) =>
    val
      .reduce((acc, cur) => acc | cur, 0)
      .toString() as unknown as `${number}`[],
  from: (val) => {
    const bits = Number(val);
    const active = Array.from(
      { length: Math.ceil(Math.log2(bits)) + 1 },
      (_, i) => 1 << i,
    ).filter((bit) => bit & bits);
    return active;
  },
};

const booleanNumber: Encoding<boolean> = {
  to: (v) => Number(v).toString() as unknown as `${boolean}`,
  from: (v) => Boolean(Number(v)),
};

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
    javascript: '',
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
        if (this.config.settings.typescript)
          this.value.javascript = await (
            await transpile()
          )(this.value.typescript);
        else this.value.javascript = this.value.typescript;
      }),
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
        await this.sandbox.call.evaluateScript(this.value.javascript);
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
