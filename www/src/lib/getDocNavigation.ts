import { type CollectionEntry, getCollection } from 'astro:content';
import type { MarkdownHeading } from 'astro';

export const getDocNavigation = async (pkg: string) => {
  const related = await getCollection('docs', ({ slug }) =>
    slug.startsWith(pkg),
  );

  const navigation = (await Promise.all(related.map(entryToNavigation))).reduce(
    intoNavTree,
    new Map(),
  );

  return navigation;
};

const intoNavTree = (tree: NavTree, nav: NavDatum): NavTree => {
  const [head, ...tail] = nav.path;
  if (!tree.has(head))
    tree.set(head, {
      label: head.replaceAll('-', ' '),
      url: ``,
    });
  const branch = tree.get(head)!;
  if (tail.length === 0) {
    const firstHeading = nav.headings.find((h) => h.depth === 1);
    Object.assign(branch, {
      label: firstHeading?.text ?? branch.label,
      url: `${nav.baseUrl}${head}/#${firstHeading?.slug ?? ''}`,
      headings: nav.headings.filter((h) => h.depth === 2),
    });
  } else
    branch.children = intoNavTree(branch.children ?? new Map(), {
      path: tail,
      baseUrl: `${nav.baseUrl}${head}/`,
      headings: nav.headings.filter((h) => h.depth === 2),
    });
  return tree;
};

export const entryToNavigation = async (
  entry: CollectionEntry<'docs'>,
): Promise<NavDatum> => {
  const [pkg, ...path] = entry.slug.split('/');
  return {
    path,
    baseUrl: `/docs/${pkg}/`,
    headings: (await entry.render()).headings,
  };
};

export type NavDatum = {
  path: string[];
  baseUrl: string;
  headings: MarkdownHeading[];
};

export type Branch = {
  label: string;
  url: string;
  headings?: MarkdownHeading[];
  children?: NavTree;
};

export type NavTree = Map<string, Branch>;
