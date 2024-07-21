import { createHighlighterCore, loadWasm } from 'shiki/core';
import html from 'shiki/langs/html.mjs';
import ts from 'shiki/langs/typescript.mjs';
import mod from 'shiki/onig.wasm';
import oneDark from 'shiki/themes/one-dark-pro.mjs';

// import wasm as assets
await loadWasm(mod);

export const highlightCode = await createHighlighterCore({
  themes: [oneDark],
  langs: [ts, html],
});
