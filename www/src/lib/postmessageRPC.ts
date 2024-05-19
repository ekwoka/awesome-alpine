export class RPCReceiver<A extends FunctionRecord<A>> {
  actions: ActionsMap<A>;
  async messageHandler(event: MessageEvent<Action<A>>) {
    const { id, name, args } = event.data;
    if (this.actions.has(name)) {
      const result = await this.actions.get(name)?.(...args, event);
      event.source?.postMessage({ id, value: result }, { targetOrigin: '*' });
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

type ActionsMap<A extends FunctionRecord<A>> = Map<
  keyof A,
  WithEventArg<A[keyof A], MessageEvent<Action<A>>>
>;

type FunctionRecord<A> = Record<
  keyof A,
  // biome-ignore lint/suspicious/noExplicitAny: Very Generic Typing
  (...args: any[]) => any
>;

type WithEventArg<
  F extends (...args: Parameters<F>) => ReturnType<F>,
  E extends MessageEvent,
> = (
  ...args: [...RemoveLastEventArg<Parameters<F>, E>, event: E]
) => ReturnType<F>;

type RemoveLastEventArg<
  A extends Array<unknown>,
  E extends MessageEvent,
> = A extends [...infer T, infer _E extends E] ? T : A;

export class RPCSender<A extends FunctionRecord<A>> {
  // biome-ignore lint/suspicious/noEmptyBlockStatements: Not actually empty
  constructor(private target: Window) {}
  call = new Proxy({} as CallObject<A>, {
    get: (target, name: string | symbol, receiver) => {
      type T = CallReturnsMap<A>;
      if (Reflect.has(target, name)) return Reflect.get(target, name, receiver);
      return <K extends keyof A>(...args: Parameters<A[K]>) => {
        const id = callProcedure(name.toString(), args, this.target);
        return {
          wait: waitForResponse.bind(null, id, this.target),
          then: (res: (value: T[K]) => void) =>
            waitForResponse<T[K]>(id, this.target).then(res),
        };
      };
    },
  });
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
): Promise<T | null> => {
  return new Promise<T | null>((res) => {
    let timeoutid: NodeJS.Timeout;
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
        res(null);
      }, timeout);
  });
};

interface Action<
  A extends Record<
    keyof A,
    (...args: Parameters<A[keyof A]>) => ReturnType<A[keyof A]>
  >,
> {
  id: number;
  name: keyof A;
  args: RemoveLastEventArg<Parameters<A[keyof A]>, MessageEvent>;
}

interface ActionResponse {
  id: number;
  value: unknown;
}

type CallReturnsMap<
  A extends Record<
    keyof A,
    (...args: Parameters<A[keyof A]>) => ReturnType<A[keyof A]>
  >,
> = {
  [K in keyof A]: Awaited<ReturnType<A[K]>> | null;
};

type CallObject<
  A extends Record<
    keyof A,
    (...args: Parameters<A[keyof A]>) => ReturnType<A[keyof A]>
  >,
  T extends Record<keyof A, ReturnType<A[keyof A]> | null> = CallReturnsMap<A>,
> = {
  [K in keyof A]: (...args: Parameters<A[K]>) => {
    wait: (ms: number) => Promise<T[K]>;
    then: (res: (value: T[K]) => void) => Promise<void>;
  };
};
