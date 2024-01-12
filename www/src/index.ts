import { makeEditor, prettify, transpile } from './lib';
import persist from '@alpinejs/persist';
import Alpine from 'alpinejs';

Alpine.plugin(persist);
Alpine.data('editor', () => ({
  panel: Alpine.$persist('html'),
  value: {
    html: `<div x-data=example x-text=text class="text-xl uppercase text-blue-300 flex justify-center items-center">This is the Editor</div>`,
    typescript:
      "Alpine.data('example', () => ({ text: 'I am the text now!' }))",
    javascript:
      "Alpine.data('example', () => ({ text: 'I am the text now!' }))",
  },
  editor: {
    html: null,
    typescript: null,
  },
  get asDocument() {
    return `<script type="module">import Alpine from '/playSandbox.ts';${this.value.javascript};Alpine.start()</script><link rel="stylesheet" href="/styles.css" /><style>body { background-color: black }</style>${this.value.html}`;
  },
  registerEditor(el: HTMLElement, type: 'html' | 'typescript') {
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
      this.value[type] = await prettify(this.value[type], 'html');
      Alpine.raw(this.editor[type])?.setValue(this.value[type]);
    }
  },
  async update(type: 'html' | 'typescript') {
    const content = Alpine.raw(this.editor[type])?.getValue();
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
