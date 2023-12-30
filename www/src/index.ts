import Alpine from 'alpinejs';
import 'cdn.tailwindcss.com/3.4.0?dlx';
import * as esbuild from 'esbuild-wasm';
import esbuildWASM from 'esbuild-wasm/esbuild.wasm?url';
import * as monaco from 'monaco-editor';
import DefaultWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import prettier from 'prettier';
import estree from 'prettier/plugins/estree.mjs';
import typescript from 'prettier/plugins/typescript.mjs';

await esbuild.initialize({
  wasmURL: esbuildWASM,
});

Alpine.data('editor', () => ({
  value: `(async(message: string) => console.log(message))('hello')`,
  editor: null,
  registerEditor(el: HTMLElement) {
    this.editor = monaco.editor.create(el, {
      value: this.value,
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
      lineHeight: 24,
      fontLigatures: true,
      fontSize: 24,
      fontVariations: true,
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden',
      },
    });
  },
  async setContent(el: HTMLElement) {
    el.replaceChildren(
      document
        .createRange()
        .createContextualFragment(
          (await esbuild.transform(this.value, { loader: 'ts' })).code,
        ),
    );
  },
  async update() {
    console.log(
      Alpine.raw(this.editor)?.getValue() ?? this.value,
      typeof Alpine.raw(this.editor)?.getValue() ?? this.value,
    );
    this.value = await prettier.format(
      Alpine.raw(this.editor)?.getValue() ?? this.value,
      { parser: 'typescript', plugins: [estree, typescript] },
    );
    console.log(this.value);
  },
}));

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    if (label === 'html') return new HTMLWorker();
    if (label === 'typescript' || label === 'javascript') return new TSWorker();
    return new DefaultWorker();
  },
};
Alpine.start();
