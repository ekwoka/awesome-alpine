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

/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

// biome-ignore lint/style/noNamespace: Astro Requires it
declare namespace App {
  interface Locals extends Runtime {
    otherLocals: {
      test: string;
    };
  }
}
