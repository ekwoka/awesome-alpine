import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import viteConfig from './vite.config.ts';
import { visit } from 'unist-util-visit';
import cloudflare from "@astrojs/cloudflare";

import metaTags from "astro-meta-tags";

// https://astro.build/config
export default defineConfig({
  vite: viteConfig,
  site: "https://awesomealpine.com/",
  image: {
    domains: ['loremflickr.com']
  },
  integrations: [tailwind({
    configFile: './tailwind.config.ts',
    nesting: true,
    applyBaseStyles: false
  }), mdx({
    optimize: true
  }), metaTags()],
  markdown: {
    shikiConfig: {
      wrap: true,
      theme: 'one-dark-pro'
    },
    rehypePlugins: [addSpacesToCode]
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site'
    }
  },
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    imageService: 'compile',
    cloudflareModules: true
  })
});
function addSpacesToCode() {
  return tree => visit(tree, 'element', (node, _index, parent) => {
    if (node.tagName === 'code' && parent?.tagName?.startsWith('h') && node.children[0]?.type === 'text') node.children[0].value = node.children[0].value.replaceAll(/[.})<]/g, match => `​${match}`).replaceAll(/[:{(>]/g, match => `${match}​`);
  });
}
