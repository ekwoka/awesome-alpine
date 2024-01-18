// eslint-disable-next-line @typescript-eslint/ban-types
export class RPCReceiver<
  A extends Record<keyof A, (...args: unknown[]) => unknown>,
> {
  actions: Map<keyof A, A[keyof A]>;
  messageHandler<K extends keyof A>(
    event: MessageEvent<{ name: K; args: Parameters<A[K]> }>,
  ) {
    const { name, args } = event.data;
    if (this.actions.has(name)) {
      this.actions.get(name)?.(...args);
    }
  }
  constructor(intitalActions: Partial<A> = {}) {
    this.actions = new Map(
      Object.entries(intitalActions) as [keyof A, A[keyof A]][],
    );
    window.addEventListener('message', this.messageHandler.bind(this));
  }
  expose<T extends keyof A>(name: T, actions: A[T]) {
    this.actions.set(name, actions);
  }
  remove<T extends keyof A>(name: T) {
    this.actions.delete(name);
  }
  destroy() {
    window.removeEventListener('message', this.messageHandler.bind(this));
  }
}

export class RPCSender<
  A extends Record<keyof A, (...args: unknown[]) => unknown>,
> {
  call = new Proxy({} as A, {
    get: (target, name: string | symbol) => {
      if (Reflect.has(target, name)) return target[name];
      return (...args: Parameters<A[keyof A]>) => {
        this.target.postMessage({ name, args }, '*');
      };
    },
  });
  constructor(private target: Window) {}
}
