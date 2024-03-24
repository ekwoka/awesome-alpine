import type { Alpine, PluginCallback } from 'alpinejs';

export const $htma = Symbol('htma');

const _hasHTMA = (el: object): el is { [$htma]: HXContext } => $htma in el;

export const HTMA: PluginCallback = (Alpine: Alpine) => {
  const elementMap = new WeakMap<HTMLElement, HXContext>();
  Alpine.addInitSelector(() => '[hx-get], [hx-post], [hx-put], [hx-delete]');
  Alpine.mapAttributes((attr) => {
    if (attr.name.startsWith('hx-'))
      attr.name = Alpine.prefixed(attr.name.replace('hx-', ''));
    return attr;
  });

  Alpine.directive('get', (el, { expression }, _extras) => {
    const hxData =
      elementMap.get(el) ||
      elementMap
        .set(el, Alpine.reactive(new HXContext(el, Verb.GET, expression)))
        .get(el)!;
    el.addEventListener('click', () => {
      hxData.fetch();
    });
  }).before('bind');
  Alpine.directive('select', (el, { expression }, _extras) => {
    const hxData = elementMap.get(el);
    if (hxData) hxData.select = expression;
  });
  Alpine.directive('swap', (el, { expression }, _extras) => {
    const hxData = elementMap.get(el);
    if (hxData) hxData.swap = expression;
  });
};

enum Verb {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

class HXContext {
  public target: HTMLElement;
  public select: string = 'body';
  public swap: string = 'innerHTML';
  constructor(
    public el: HTMLElement,
    public method = Verb.GET,
    public action: maybeFunc<string> = '',
  ) {
    this.target = el;
  }
  get GET() {
    return callIfFunc(this.action);
  }
  async fetch() {
    try {
      const response = await fetch(callIfFunc(this.action), {
        method: this.method,
      });
      if (!response.ok) return console.error(new Error(response.statusText));
      console.log(this.select);
      const html = await response.text();
      return this.performSwap(parseDom(html));
    } catch (error) {
      console.error(error);
    }
  }
  performSwap(doc: Document) {
    console.log(doc);
    const node = doc.querySelector(this.select);
    console.log(node);
    if (!node) return console.error(new Error('No matching element found'));
    this.target[
      swapMethodMap[this.swap as keyof typeof swapMethodMap] ?? this.swap
    ](node);
  }
}

const swapMethodMap = {
  innerHTML: 'replaceChildren',
  outerHTML: 'replaceWith',
  replace: 'replaceWith',
} as const;

const parseDom = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html');

type maybeFunc<T> = T | (() => T);
const callIfFunc = <T>(maybeFunc: maybeFunc<T>): T =>
  maybeFunc instanceof Function ? maybeFunc() : maybeFunc;
const _funcWrap = <T>(maybeFunc: maybeFunc<T>): (() => T) =>
  maybeFunc instanceof Function ? maybeFunc : () => maybeFunc;
