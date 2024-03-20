// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*?worker' {
  export default class extends Worker {
    constructor();
  }
}

declare module '*?raw' {
  const types: string;
  export default types;
}

declare module '*?dlx' {
  export default unknown;
}

declare module '*?urlfollow' {
  export const url: string;
}

declare global {
  interface Window {
    Alpine: import('alpinejs').Alpine;
  }
}
