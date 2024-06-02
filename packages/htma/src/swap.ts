import type { Alpine } from 'alpinejs';

export enum SwapMethod {
  None = 0, // Do nothing
  Delete = 1 << 0, // Delete the target
  Replace = 1 << 1, // Replace the target Outer
  ReplaceChildren = 1 << 2, // Replace the target Inner
  Before = 1 << 3, // Source goes before the target
  Prepend = 1 << 4, // Source goes at the start of the target
  Append = 1 << 5, // Source goes outside the target
  After = 1 << 6, // Source goes at the end of the target
  Morph = 1 << 7, // Target is Morphed to Source
}

const forEach = Array.prototype.forEach;

const skipClean = (
  method: SwapMethod,
): method is
  | SwapMethod.None
  | SwapMethod.Before
  | SwapMethod.Prepend
  | SwapMethod.Append
  | SwapMethod.After
  | SwapMethod.Morph =>
  Boolean(
    method &
      (SwapMethod.None |
        SwapMethod.Before |
        SwapMethod.Prepend |
        SwapMethod.Append |
        SwapMethod.After |
        SwapMethod.Morph),
  );

const skipInit = (
  method: SwapMethod,
): method is SwapMethod.None | SwapMethod.Delete | SwapMethod.Morph =>
  Boolean(method & (SwapMethod.None | SwapMethod.Delete | SwapMethod.Morph));

export class Swap {
  constructor(
    public target: HTMLElement,
    public source: HTMLElement,
    public method: SwapMethod,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Not Actually Empty
  ) {}
  swap(Alpine: Alpine) {
    if (this.method === SwapMethod.None) return;
    if (this.method === SwapMethod.Delete) return this.target.remove();
    if (this.method === SwapMethod.Replace)
      return this.target.replaceWith(this.source);
    if (this.method === SwapMethod.ReplaceChildren) {
      return this.target.replaceChildren(this.source);
    }
    if (this.method === SwapMethod.Before)
      return this.target.before(this.source);
    if (this.method === SwapMethod.Prepend)
      return this.target.prepend(this.source);
    if (this.method === SwapMethod.Append)
      return this.target.append(this.source);
    if (this.method === SwapMethod.After) return this.target.after(this.source);
    if (this.method === SwapMethod.Morph && 'morph' in Alpine)
      Alpine.morph(this.target, this.source, {});
  }
  clean(Alpine: Alpine) {
    if (skipClean(this.method)) return;
    if (this.method === SwapMethod.ReplaceChildren)
      forEach.call(this.target.children, (child: HTMLElement) =>
        Alpine.destroyTree(child),
      );
    return Alpine.destroyTree(this.target);
  }
  initialize(Alpine: Alpine) {
    if (skipInit(this.method)) return;
    if (this.method === SwapMethod.ReplaceChildren)
      return forEach.call(this.target.children, (child: HTMLElement) =>
        Alpine.initTree(child),
      );
    return Alpine.initTree(this.source);
  }
}
