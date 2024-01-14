import { makeEditor, prettify, transpile } from './lib';
import { Language } from './lib/prettier';
import persist from '@alpinejs/persist';
import Alpine from 'alpinejs';
import { editor } from 'monaco-editor';

Alpine.plugin(persist);
Alpine.data('editor', () => ({
  panel: Alpine.$persist('html'),
  config: {
    plugins: [],
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
    return `<script type="module">import setup from '/playSandbox.ts';
    const Alpine = await setup(${JSON.stringify(this.config)});${
      this.value.javascript
    };
    Alpine.start();</script><link rel="stylesheet" href="/styles.css" /><style>body { background-color: black }</style>${
      this.value.html
    }`;
  },
  registerEditor(el: HTMLElement, type: Language) {
    this.editor[type] = makeEditor(el, this.value[type], type);
  },
  setContent(el: HTMLIFrameElement) {
    el.contentDocument.body.replaceChildren(
      document.createRange().createContextualFragment(this.asDocument),
    );
  },
  init() {
    this.prettify();
    Alpine.effect(
      async () =>
        (this.value.javascript = await transpile(this.value.typescript)),
    );
  },
  async prettify() {
    for (const type in this.value) {
      this.value[type] = await prettify(
        this.value[type],
        type as unknown as 'html',
      );
      Alpine.raw(this.editor[type])?.setValue(this.value[type]);
    }
  },
  async update(type: 'html' | 'typescript') {
    const content = Alpine.raw<(typeof this.editor)[typeof type]>(
      this.editor[type],
    )?.getValue();
    this.value[type] = await prettify(content, 'html');
  },
}));

window.Alpine = Alpine;
Alpine.start();

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}
