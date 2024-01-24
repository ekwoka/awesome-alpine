import { Language } from './prettier';
// @ts-expect-error - this is a raw types import for monaco
import dts from '@types/alpinejs/index.d.ts?raw';
import * as monaco from 'monaco-editor';
import DefaultWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import tomorrow from 'monaco-themes/themes/Tomorrow-Night.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
monaco.editor.defineTheme('tomorrow-night', tomorrow as any);
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
export const makeEditor = (
  el: HTMLElement,
  initialContent: string,
  type: Language,
) => {
  const editor = monaco.editor.create(el, {
    value: initialContent,
    language: type,
    theme: 'tomorrow-night',
    automaticLayout: false,
    minimap: {
      enabled: false,
    },
    lineHeight: 36,
    letterSpacing: 1,
    fontFamily: 'ml',
    fontLigatures: true,
    fontSize: 16,
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
