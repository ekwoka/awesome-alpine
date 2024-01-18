import { prettify } from './lib';
import { Language } from './lib/prettier';
import { Config, sandboxActions } from './playSandbox';
import { CorePlugins } from './playSandbox';
import { RPCSender } from './postmessageRPC';
import sandboxScript from '/playSandbox.js?url';
import persist from '@alpinejs/persist';
import query, { base64URL } from '@ekwoka/alpine-history';
import Alpine from 'alpinejs';
import type { editor } from 'monaco-editor';

const makeEditor = () =>
  import('./lib/makeEditor.ts').then((m) => m.makeEditor);

const transpile = () => import('./lib/transpile.ts').then((m) => m.transpile);

Alpine.plugin([persist, query]);
Alpine.data('editor', () => ({
  panel: Alpine.query('html'),
  config: {
    plugins: [],
    settings: {
      typescript: false,
      tailwind: false,
    },
  },
  value: {
    html: Alpine.query(
      `<div x-data="example" x-text="text" class="text-xl uppercase !text-blue-300 flex justify-center items-center" style="color:white">This is the Editor</div>`,
    )
      .encoding(base64URL)
      .as('html'),
    typescript: Alpine.query(
      "Alpine.data('example', () => ({ text: 'I am the text now!' }))",
    )
      .encoding(base64URL)
      .as('ts'),
    javascript: '',
  },
  editor: {
    html: null as editor.IStandaloneCodeEditor,
    typescript: null as editor.IStandaloneCodeEditor,
  },
  get asDocument(): string {
    return `<script type="module">
    import setup from '${sandboxScript}';
    const Alpine = await setup(${JSON.stringify(this.config)});${
      this.value.javascript
    };
    Alpine.start();
    </script>
    <style>body { background-color: black }</style>${this.value.html}`;
  },
  async registerEditor(el: HTMLElement, type: Language) {
    this.editor[type] = (await makeEditor())(el, this.value[type], type);
  },
  setContent(el: HTMLIFrameElement) {
    el.contentDocument.body.replaceChildren(
      document.createRange().createContextualFragment(this.asDocument),
    );
  },
  init() {
    Alpine.effect(async () => {
      if (this.config.settings.typescript)
        this.value.javascript = await (
          await transpile()
        )(this.value.typescript);
      else this.value.javascript = this.value.typescript;
    });
  },
  async prettify() {
    for (const type of [Language.HTML, Language.TYPESCRIPT]) {
      this.value[type] = await prettify(this.value[type], type as Language);
      Alpine.raw(await this.editor[type])?.setValue(this.value[type]);
    }
  },
  async update(type: 'html' | 'typescript') {
    const content = Alpine.raw<(typeof this.editor)[typeof type]>(
      this.editor[type],
    )?.getValue();
    this.value[type] = await prettify(content, Language.HTML);
  },
}));

window.Alpine = Alpine;
Alpine.start();

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

const sandbox = await window.sandbox;

const rpc = new RPCSender<sandboxActions>(sandbox);

rpc.call.log('Hello there');
rpc.call.loadPlugins({ plugins: [CorePlugins.Anchor] } as Config);

declare global {
  interface Window {
    sandbox: Promise<Window>;
  }
}
