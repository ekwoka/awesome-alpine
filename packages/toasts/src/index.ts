import type { Alpine, PluginCallback } from 'alpinejs';

import { Toast, type ToastDetails } from './Toast.ts';

export const Toasts = ((AlpineOrDefaults: Alpine | ToastDetails) => {
  const defaults = isAlpine(AlpineOrDefaults) ? {} : AlpineOrDefaults;
  const plugin = (Alpine: Alpine) => {
    let toastId = 0;
    const toasterTimeout = 1000;

    const toastManager = Alpine.reactive<ToastManager>({
      queue: [] as Toast[],

      show(message: string, details: ToastDetails = {}): Toast | void {
        if (!message) {
          return console.error('$toasts.show requires a message');
        }

        const toast = Alpine.reactive(
          new Toast(toastId++, message, Object.assign({}, defaults, details)),
        );
        this.queue.push(toast);
        Alpine.nextTick(() => toast.show().hide(details?.timeout ?? 0));
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
  };
  if (isAlpine(AlpineOrDefaults)) return plugin(AlpineOrDefaults);
  return plugin;
}) as {
  (Alpine: Alpine): void;
  (defaults: ToastDetails): PluginCallback;
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
   * Add a toast to the queue, and show it
   * @param {String} message
   * @param {Record} details extra information to attach to toast
   * @returns {Toast | void} Toast object if successful
   */
  show: (message: string, details?: Record<string, unknown>) => Toast | void;

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
