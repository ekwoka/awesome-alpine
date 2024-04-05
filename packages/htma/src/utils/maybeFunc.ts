export type maybeFunc<T> = T | (() => T);
export const callIfFunc = <T>(maybeFunc: maybeFunc<T>): T =>
  maybeFunc instanceof Function ? maybeFunc() : maybeFunc;
export const _funcWrap = <T>(maybeFunc: maybeFunc<T>): (() => T) =>
  maybeFunc instanceof Function ? maybeFunc : () => maybeFunc;
