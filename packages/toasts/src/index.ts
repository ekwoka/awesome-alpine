import type { Alpine, PluginCallback } from 'alpinejs';

import { Toast, type ToastOptions, type ToastOptionsSet } from './Toast.ts';
import { defaultOptions } from './defaultOptions.ts';

export const Toasts = ((AlpineOrDefaults: Alpine | Partial<ToastOptions>) => {
  const defaults = isAlpine(AlpineOrDefaults)
    ? defaultOptions
    : (deepMergeAll({}, defaultOptions, AlpineOrDefaults) as ToastOptions);
  const plugin = (Alpine: Alpine) => {
    let toastId = 0;
    const toasterTimeout = 1000;

    const toastManager = Alpine.reactive<ToastManager>({
      queue: [] as Toast[],

      show(
        message: string,
        type = 'info',
        details: ToastOptionsSet = {},
      ): Toast | void {
        if (!message) {
          return console.error('$toasts.show requires a message');
        }

        const toast = Alpine.reactive(
          new Toast(
            toastId++,
            type,
            message,
            deepMergeAll({}, defaults, details),
          ),
        );
        this.queue.push(toast);
        toast.hide(details?.duration ?? toasterTimeout);
        return toast;
      },
      success(
        message: string,
        details: ToastOptionsSet = { duration: 2000 },
      ): Toast | void {
        return this.show(
          message,
          'success',
          deepMergeAll({}, defaults, defaults.success, details),
        );
      },
      error(message: string, details: ToastOptionsSet = {}): Toast | void {
        return this.show(
          message,
          'error',
          deepMergeAll({}, defaults, defaults.error, details),
        );
      },
      loading(
        message: string,
        details: ToastOptionsSet = { duration: 0 },
      ): Toast | void {
        return this.show(
          message,
          'loading',
          deepMergeAll({}, defaults, defaults.loading, details),
        );
      },
      promise<T>(
        pr: Promise<T>,
        message: PromiseHandlers<T>,
        details: Partial<Omit<ToastOptions, 'custom'>> = {},
      ) {
        const toast = this.loading(
          message.loading,
          deepMergeAll({}, details, details.loading ?? {}),
        );
        if (!toast) return;
        pr.then(
          (result) => {
            toast.type = 'success';
            toast.message =
              typeof message.success === 'function'
                ? message.success(result)
                : message.success;
            toast.options = deepMergeAll({}, details, details.success ?? {});
            toast.hide(2000);
          },
          (error) => {
            toast.type = 'error';
            toast.message =
              typeof message.error === 'function'
                ? message.error(error)
                : message.error;
            toast.options = deepMergeAll({}, details, details.error ?? {});
            toast.hide(5000);
          },
        );
        return toast;
      },
      clearFromQueue(toast: Toast): boolean {
        if (toast.shown) return false;
        toast.clear();
        const toastIndex = this.queue.indexOf(toast);
        if (toastIndex > -1) this.queue.splice(toastIndex, 1);
        return true;
      },
      hide(toast: Toast): ReturnType<typeof setTimeout> | void {
        toast.hide(toasterTimeout);
      },
      dismiss(toast: Toast) {
        toast.dismiss();
      },
    });
    Alpine.$toasts = toastManager;
    Alpine.magic('toasts', () => toastManager);
    Alpine.directive('toaster', (el, _, { Alpine }) => {
      Alpine.bind(el, {
        'x-for': '$toast of $toasts.queue',
        ':key': '$toast.id',
      });
    });
    Alpine.directive('toast-transition', (el, _, { evaluate, effect }) => {
      const animation = new Animation(
        new KeyframeEffect(
          el,
          [
            {
              opacity: '0',
              gridTemplateRows: '0fr',
              transform: 'scale(0.25)',
              margin: '0',
            },
            {
              opacity: '1',
              gridTemplateRows: '1fr',
              margin: '0.25rem 0',
              transform: 'scale(1)',
            },
          ],
          { duration: 200, fill: 'both' },
        ),
      );
      animation.persist();
      animation.play();
      const $toast = evaluate<Toast>('$toast');
      effect(() => {
        if ($toast.shown) return;
        animation.playbackRate = -1;
        animation.finished.then(() => {
          console.log('finished');
          toastManager.clearFromQueue($toast);
        });
      });
    });
  };
  if (isAlpine(AlpineOrDefaults)) return plugin(AlpineOrDefaults);
  return plugin;
}) as {
  (Alpine: Alpine): void;
  (defaults: ToastOptionsSet): PluginCallback;
};

const isAlpine = (MaybeAlpine: unknown): MaybeAlpine is Alpine =>
  typeof MaybeAlpine === 'object' &&
  MaybeAlpine !== null &&
  `version` in MaybeAlpine;

export default Toasts;

declare module 'alpinejs' {
  interface Alpine {
    /**
     * x-toast manager
     */
    $toasts: ToastManager;
  }
}

type ToastManager = {
  /**
   * Queue of toasts to be shown
   * @type {Array<Toast>}
   */
  queue: Toast[];

  /**
   * Add a generically typed toast to the queue, and show it
   * @param {String} message
   * @param {string} type @default 'info'
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  show: (
    message: string,
    type: string,
    details?: Record<string, unknown>,
  ) => Toast | void;

  /**
   * Add a Success toast to the queue
   * @param {String} message
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  success: (message: string, details?: Record<string, unknown>) => Toast | void;
  /**
   * Add an Error toast to the queue
   * @param {String} message
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  error: (message: string, details?: Record<string, unknown>) => Toast | void;
  /**
   * Add an Error toast to the queue
   * @param {String} message
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  loading: (message: string, details?: Record<string, unknown>) => Toast | void;

  /**
   * Add an dynamic toast to the queue representing a promise.
   * @param {String} message
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  promise: <T>(
    pr: Promise<T>,
    message: PromiseHandlers<T>,
    details?: Record<string, unknown>,
  ) => Toast | void;

  /**
   * Clears a toast from the queue
   * @param {Toast} toast to dismiss
   * @returns {Boolean} true if toast was removed
   */
  clearFromQueue: (toast: Toast) => boolean;

  /**
   * Begins timer to hide Toast
   * @param {Toast} toast
   * @returns {Number | void} TimeoutId if timeout present
   */
  hide: (toast: Toast) => ReturnType<typeof setTimeout> | void;

  /**
   * Hide passed toast immediately
   * @param {Toast} toast
   */
  dismiss: (toast: Toast) => void;
};

/* Initialize Toast Queue with any loading toasts from queryParams */
export const InitializeParams: PluginCallback = (Alpine) => {
  const toastParamKeys = ['message', 'type', 'timeout'];
  const params = new URLSearchParams(window.location.search);

  if (!params.has('toast.message')) return;

  const toastData: Parameters<ToastManager['show']> = toastParamKeys.map(
    (key) => params.get(`toast.${key}`) ?? undefined,
  ) as Parameters<ToastManager['show']>;

  if (toastData[0]) Alpine.$toasts.show(...toastData);

  toastParamKeys.forEach((key) => params.delete(`toast.${key}`));

  history.replaceState(
    history.state,
    '',
    `${window.location.pathname}?${params.toString()}`,
  );
};

type PromiseHandlers<T> = {
  loading: string;
  success: string | ((result: T) => string);
  error: string | ((error: unknown) => string);
};

const deepMergeAll = <T extends Record<string, unknown>>(...sources: T[]): T =>
  sources.reduce(deepMerge);

const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: T,
): T => {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) Reflect.set(target, key, {});
      deepMerge(target[key] as T, source[key] as T);
    } else {
      Reflect.set(target, key, source[key]);
    }
  }
  return target;
};
