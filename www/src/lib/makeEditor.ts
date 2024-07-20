import { shikiToMonaco } from '@shikijs/monaco';
// @ts-expect-error - this is a raw types import for monaco
import dts from '@types/alpinejs/index.d.ts?raw';
import * as monaco from 'monaco-editor';
import DefaultWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { createHighlighter } from 'shiki';
import { Language } from './prettier';

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `
  ${dts}
  declare global {
    var Alpine: Alpine;
}`,
  'alpinejs',
);
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  experimentalDecorators: true,
  allowSyntheticDefaultImports: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  allowNonTsExtensions: true,
  target: monaco.languages.typescript.ScriptTarget.ESNext,
});
const highlighter = await createHighlighter({
  themes: ['one-dark-pro'],
  langs: ['html', 'css', 'javascript', 'typescript'],
});
shikiToMonaco(highlighter, monaco);
export const makeEditor = (
  el: HTMLElement,
  initialContent: string,
  type: Language,
) => {
  const editorEl = document.createElement('div');
  const editor = monaco.editor.create(editorEl, {
    value: initialContent,
    language: type,
    theme: 'one-dark-pro',
    automaticLayout: false,
    minimap: {
      enabled: false,
    },
    lineHeight: 36,
    letterSpacing: 1.25,
    fontFamily: 'ml',
    fontLigatures: "'calt' on,'liga' on, 'ss02' on",
    fontSize: 14,
    fontVariations: true,
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
    },
    wordWrap: 'on',
    wordWrapColumn: 80,
    wrappingIndent: 'indent',
  });
  const observer = new ResizeObserver(() => {
    editor.layout({ height: el.offsetHeight, width: el.offsetWidth });
  });

  el.replaceChildren(editorEl);
  observer.observe(el);

  return editor;
};

window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'html') return new HTMLWorker();
    if (label === 'typescript' || label === 'javascript') return new TSWorker();
    return new DefaultWorker();
  },
};
