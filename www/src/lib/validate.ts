export class Struct<T extends { [key: string]: Validator }> {
  constructor(public properties: T) {}
  public mask(obj: { [key: string]: string }): {
    [key in keyof T]: ReturnType<T[key]['validate']>;
  } {
    return Object.fromEntries(
      Object.entries(this.properties).map(([key, value]) => [
        key,
        value.validate(obj[key] ?? null),
      ]),
    ) as { [key in keyof T]: ReturnType<T[key]['validate']> };
  }
}

interface Validator {
  validate(str: string | null): unknown;
}

export class PropTransformer<T> implements Validator {
  constructor(public transform: (str: string | null) => T) {}
  public validate(str: string | null): T {
    return this.transform(str);
  }
}
