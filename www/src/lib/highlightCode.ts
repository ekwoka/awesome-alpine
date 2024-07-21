import { createHighlighterCore, loadWasm } from 'shiki/core';
import html from 'shiki/langs/html.mjs';
import ts from 'shiki/langs/typescript.mjs';
import oneDark from 'shiki/themes/one-dark-pro.mjs';

// import wasm as assets
await loadWasm(import(/* @vite-ignore */ 'shiki/onig.wasm?'));

export const highlightCode = await createHighlighterCore({
  themes: [oneDark],
  langs: [ts, html],
});
