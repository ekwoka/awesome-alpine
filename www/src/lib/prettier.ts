import { format } from 'prettier';

const estree = () => import('prettier/plugins/estree.mjs');
const html = () => import('prettier/plugins/html.mjs');
const typescript = () => import('prettier/plugins/typescript.mjs');

export enum Language {
  HTML = 'html',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export const coerceLanguage = (language: Language): Language => {
  switch (language) {
    case Language.HTML:
      return Language.HTML;
    case Language.TYPESCRIPT:
    case Language.JAVASCRIPT:
      return Language.TYPESCRIPT;
    default:
      return Language.HTML;
  }
};

const getPlugins = (type: Language) => {
  switch (type) {
    case 'html':
      return [html()];
    case 'javascript':
    case 'typescript':
      return [estree(), typescript()];
    default:
      return [];
  }
};

export const prettify = async (content: string, type: Language) =>
  format(content, {
    parser: coerceLanguage(type),
    plugins: await Promise.all(getPlugins(type)),
    singleQuote: true,
    singleAttributePerLine: true,
    printWidth: 60,
  });
