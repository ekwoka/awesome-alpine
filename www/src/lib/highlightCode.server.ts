import { createHighlighter } from 'shiki';
import { createOnigurumaEngine, loadWasm } from 'shiki/engine/oniguruma';
import html from 'shiki/langs/html.mjs';
import ts from 'shiki/langs/typescript.mjs';
import mod from 'shiki/onig.wasm';
import oneDark from 'shiki/themes/one-dark-pro.mjs';

// import wasm as assets
await loadWasm(mod);

export const highlightCode = await createHighlighter({
  themes: [oneDark],
  langs: [ts, html],
  engine: createOnigurumaEngine(() => import('shiki/wasm')),
});
