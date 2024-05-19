/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*?worker' {
  export default class extends Worker {
    constructor();
  }
}

declare module '*?dlx' {
  const output: unknown;
  export default output;
}

declare module '*?urlfollow' {
  export const url: string;
}

interface Window {
  Alpine: import('alpinejs').Alpine;
}
