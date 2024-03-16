import viteConfig from './vite.config.ts';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: viteConfig,
  integrations: [
    tailwind({
      configFile: './tailwind.config.ts',
      nesting: true,
      applyBaseStyles: false,
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  },
});
