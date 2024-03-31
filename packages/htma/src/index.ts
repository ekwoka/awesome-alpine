import type { Alpine, PluginCallback } from 'alpinejs';

import { Swap, SwapMethod } from './swap.ts';
import { callIfFunc, type maybeFunc } from './utils/maybeFunc.ts';
import { parseDom } from './utils/parseDom.ts';

export const $htma = Symbol('htma');

const _hasHTMA = (el: object): el is { [$htma]: HXBinding } => $htma in el;

export const HTMA: PluginCallback = (Alpine) => {
  const elementMap = new WeakMap<HTMLElement, HXBinding>();
  Alpine.addInitSelector(() => '[hx-get], [hx-post], [hx-put], [hx-delete]');
  Alpine.mapAttributes((attr) => {
    if (attr.name.startsWith('hx-'))
      attr.name = Alpine.prefixed(attr.name.replace('hx-', 'hx'));
    return attr;
  });

  Alpine.directive('hxget', (el, { expression }, _extras) => {
    const hxData =
      elementMap.get(el) ||
      elementMap
        .set(
          el,
          Alpine.reactive(new HXBinding(el, Verb.GET, expression, Alpine)),
        )
        .get(el)!;
    el.addEventListener('click', () => {
      hxData.fetch();
    });
  }).before('bind');
  Alpine.directive('hxselect', (el, { expression }, _extras) => {
    const hxData = elementMap.get(el);
    if (hxData) hxData.select = expression;
  });
  Alpine.directive('hxswap', (el, { expression }, _extras) => {
    const hxData = elementMap.get(el);
    if (hxData) hxData.swap = Number(expression);
  });
};

enum Verb {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

class HXBinding {
  public target: HTMLElement;
  public select: string = 'body';
  public swap = SwapMethod.Replace;
  constructor(
    public el: HTMLElement,
    public method = Verb.GET,
    public action: maybeFunc<string> = '',
    private alp: Alpine,
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
    const node = doc.querySelector<HTMLElement>(this.select);
    console.log(node);
    if (!node) return console.error(new Error('No matching element found'));
    const swap = new Swap(this.target, node, this.swap);
    this.alp.mutateDom(() => {
      swap.clean(this.alp);
      swap.swap(this.alp);
      swap.initialize(this.alp);
    });
  }
}