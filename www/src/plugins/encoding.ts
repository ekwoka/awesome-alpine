import type { Encoding } from '@ekwoka/alpine-history';

export const bitwiseArray: Encoding<number[]> = {
  to: (val) =>
    val
      .reduce((acc, cur) => acc | cur, 0)
      .toString() as unknown as `${number}`[],
  from: (val) => {
    const bits = Number(val);
    const active = Array.from(
      { length: Math.ceil(Math.log2(bits)) + 1 },
      (_, i) => 1 << i,
    ).filter((bit) => bit & bits);
    return active;
  },
};

export const booleanNumber: Encoding<boolean> = {
  to: (v) => Number(v).toString() as unknown as `${boolean}`,
  from: (v) => Boolean(Number(v)),
};
