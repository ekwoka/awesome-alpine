/* @ts-expect-error - this is a self initializing module */
export const loadTailwind = () => import('cdn.tailwindcss.com/3.4.1?dlx');
