import Typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,tsx,svg}'],
  theme: {
    extend: {},
  },
  plugins: [Typography()],
} satisfies Config;
