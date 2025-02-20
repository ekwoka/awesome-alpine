import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine, loadWasm } from 'shiki/engine/oniguruma';
import html from 'shiki/langs/html.mjs';
import ts from 'shiki/langs/typescript.mjs';
import oneDark from 'shiki/themes/one-dark-pro.mjs';

export const highlightCode = await createHighlighterCore({
  themes: [oneDark],
  langs: [ts, html],
  engine: createOnigurumaEngine(() => import('shiki/wasm')),
});
