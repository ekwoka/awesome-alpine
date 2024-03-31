import type { Alpine } from 'alpinejs';

enum SwapMethod {
  None = 0, // Do nothing
  Delete = 1 << 0, // Delete the target
  Replace = 1 << 1, // Replace the target Outer
  ReplaceChildren = 1 << 2, // Replace the target Inner
  Before = 1 << 3, // Sourrce is Prepend
  Prepend = 1 << 4, // Source goes at the start of the target
  Append = 1 << 5, // Source goes outside the target
  After = 1 << 6, // Source goes at the end of the target
  Morph = 1 << 7, // Target is Morphed to Source
}

const forEach = Array.prototype.forEach;

export const swap = (
  target: HTMLElement,
  source: HTMLElement,
  method: SwapMethod = SwapMethod.Replace,
) => {
  console.log(target, source, method);
};

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
  ) {}
  clean(Alpine: Alpine) {
    if (skipClean(this.method)) return;
    if (this.method === SwapMethod.ReplaceChildren)
      return forEach.call(this.target.children, Alpine.destroyTree);
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
