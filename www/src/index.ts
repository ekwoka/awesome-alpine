import { makeEditor, prettify } from './lib';
import Alpine from 'alpinejs';

Alpine.data('editor', () => ({
  value: `<div class="text-xl uppercase text-blue-300 flex justify-center items-center">This is the Editor</div>`,
  editor: null,
  get asDocument() {
    return `<script src="/playSandbox.ts" type="module"></script><link rel="stylesheet" href="/styles.css" />${this.value}`;
  },
  registerEditor(el: HTMLElement) {
    this.editor = makeEditor(el, this.value, 'html');
  },
  setContent(el: HTMLIFrameElement) {
    el.contentDocument.body.replaceChildren(
      document.createRange().createContextualFragment(this.asDocument),
    );
  },
  async prettify() {
    this.value = await prettify(this.value, 'html');
    Alpine.raw(this.editor)?.setValue(this.value);
  },
  async update() {
    this.value = Alpine.raw(this.editor)?.getValue();
    this.value = await prettify(this.value, 'html');
  },
}));

window.Alpine = Alpine;
Alpine.start();

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}
