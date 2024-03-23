import Typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,tsx,svg,astro,mdx}'],
  theme: {
    extend: {},
  },
  darkMode: 'media',
  plugins: [Typography()],
} satisfies Config;
