import { format } from 'prettier';

const estree = () => import('prettier/plugins/estree.mjs');
const html = () => import('prettier/plugins/html.mjs');
const typescript = () => import('prettier/plugins/typescript.mjs');

const getPlugins = (type: 'html' | 'typescript') => {
  switch (type) {
    case 'html':
      return [html()];
    case 'typescript':
      return [estree(), typescript()];
    default:
      return [];
  }
};

export const prettify = async (content: string, type: 'html' | 'typescript') =>
  format(content, {
    parser: type,
    plugins: await Promise.all(getPlugins(type)),
    singleQuote: true,
    singleAttributePerLine: true,
    printWidth: 60,
  });
