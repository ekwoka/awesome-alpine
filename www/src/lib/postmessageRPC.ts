// eslint-disable-next-line @typescript-eslint/ban-types
export class RPCReceiver<
  A extends Record<keyof A, (...args: unknown[]) => unknown>,
> {
  actions: Map<keyof A, A[keyof A]>;
  async messageHandler(event: MessageEvent<Action<A>>) {
    const { id, name, args } = event.data;
    if (this.actions.has(name)) {
      const result = await this.actions.get(name)?.(...args, event);
      event.source?.postMessage({ id, value: result }, '*' as undefined);
    }
  }
  constructor(intitalActions: Partial<A> = {}) {
    this.messageHandler = this.messageHandler.bind(this);
    this.actions = new Map(
      Object.entries(intitalActions) as [keyof A, A[keyof A]][],
    );
    window.addEventListener('message', this.messageHandler);
  }
  expose<T extends keyof A>(name: T, actions: A[T]) {
    this.actions.set(name, actions);
  }
  remove<T extends keyof A>(name: T) {
    this.actions.delete(name);
  }
  destroy() {
    window.removeEventListener('message', this.messageHandler);
  }
}

export class RPCSender<
  A extends Record<keyof A, (...args: unknown[]) => unknown>,
> {
  call = new Proxy({} as A, {
    get: (target, name: string | symbol) => {
      if (Reflect.has(target, name)) return target[name];
      return (...args: Parameters<A[keyof A]>) => {
        const id = callProcedure(name.toString(), args, this.target);
        return {
          wait: waitForResponse.bind(null, id, this.target),
          then: (res: (value: ReturnType<A[keyof A]>) => void) =>
            waitForResponse(id, this.target).then(res),
        };
      };
    },
  });
  constructor(private target: Window) {}
}

const callProcedure = (
  name: string,
  args: unknown[],
  target: Window,
): number => {
  const id = (Math.random() * 100_000) | 0;
  target.postMessage({ id, name, args }, '*');
  return id;
};

const waitForResponse = <T>(
  id: number,
  source: Window,
  timeout: number = 0,
): Promise<T> => {
  return new Promise<T>((res) => {
    let timeoutid;
    const handler = (event: MessageEvent<ActionResponse>) => {
      if (event.source === source && event.data.id === id) {
        window.removeEventListener('message', handler);
        clearTimeout(timeoutid);
        res(event.data.value as T);
      }
    };
    window.addEventListener('message', handler);
    if (timeout)
      timeoutid = setTimeout(() => {
        window.removeEventListener('message', handler);
        res(undefined);
      }, timeout);
  });
};

// eslint

interface Action<A> {
  id: number;
  name: keyof A;
  args: unknown[];
}

interface ActionResponse {
  id: number;
  value: unknown;
}
