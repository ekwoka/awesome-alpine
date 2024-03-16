import type { Alpine } from 'alpinejs';

declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
  export default class extends Worker {
    constructor();
  }
}
declare module 'monaco-editor/esm/vs/language/html/html.worker?worker' {
  export default class extends Worker {
    constructor();
  }
}
declare module 'monaco-editor/esm/vs/language/typescript/ts.worker?worker' {
  export default class extends Worker {
    constructor();
  }
}
declare module '@types/alpinejs/index.d.ts?raw' {
  const types: string;
  export default types;
}

declare module 'cdn.tailwindcss.com/3.4.1?dlx' {
  const tailwind: unknown;
  export default tailwind;
}

declare module 'esbuild-wasm/esbuild.wasm?url' {
  const esbuildWASM: string;
  export default esbuildWASM;
}

declare module global {
  interface Window {
    Alpine: Alpine;
  }
}

declare module 'alpine-versions' {
  const data: Record<string, `${number}.${number}.${number}`[]>;
  export default data;
}

declare type Nullable<T> = T | null;
