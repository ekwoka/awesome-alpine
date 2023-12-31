import * as monaco from 'monaco-editor';
import DefaultWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

export const makeEditor = (
  el: HTMLElement,
  initialContent: string,
  type: 'html' | 'typescript',
) =>
  monaco.editor.create(el, {
    value: initialContent,
    language: type,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    lineHeight: 32,
    letterSpacing: 1,
    fontLigatures: true,
    fontSize: 16,
    fontVariations: true,
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
    },
    wordWrap: 'bounded',
    wordWrapColumn: 80,
    wrappingIndent: 'indent',
  });

window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'html') return new HTMLWorker();
    if (label === 'typescript' || label === 'javascript') return new TSWorker();
    return new DefaultWorker();
  },
};
