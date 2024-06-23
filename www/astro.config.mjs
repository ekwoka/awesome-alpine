import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import viteConfig from './vite.config.ts';

// https://astro.build/config
export default defineConfig({
  vite: viteConfig,
  image: {
    domains: ['loremflickr.com'],
  },
  integrations: [
    tailwind({
      configFile: './tailwind.config.ts',
      nesting: true,
      applyBaseStyles: false,
    }),
    mdx({ optimize: true }),
  ],
  markdown: {
    shikiConfig: {
      wrap: true,
      theme: 'one-dark-pro',
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  },
});
