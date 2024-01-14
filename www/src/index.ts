import { prettify } from './lib';
import { Language } from './lib/prettier';
import sandboxScript from '/playSandbox.js?url';
import persist from '@alpinejs/persist';
import Alpine, { type ReactiveEffect } from 'alpinejs';
import type { editor } from 'monaco-editor';

const makeEditor = () =>
  import('./lib/makeEditor.ts').then((m) => m.makeEditor);

const transpile = () => import('./lib/transpile.ts').then((m) => m.transpile);

Alpine.plugin(persist);
Alpine.data('editor', () => ({
  panel: Alpine.$persist('html'),
  config: {
    plugins: [],
    settings: {
      typescript: false,
      tailwind: false,
    },
  },
  value: {
    html: `<div x-data=example x-text=text class="text-xl uppercase text-blue-300 flex justify-center items-center" style="color:white">This is the Editor</div>`,
    typescript:
      "Alpine.data('example', () => ({ text: 'I am the text now!' }))",
    javascript:
      "Alpine.data('example', () => ({ text: 'I am the text now!' }))",
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
    let transpilationEffect: ReactiveEffect = null;
    Alpine.effect(() => {
      if (this.config.settings.typescript)
        transpilationEffect ??= Alpine.effect(
          async () =>
            (this.value.javascript = await (
              await transpile()
            )(this.value.typescript)),
        );
      else if (transpilationEffect)
        Alpine.release(transpilationEffect), (transpilationEffect = null);
    });
  },
  async prettify() {
    for (const type in this.value) {
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
