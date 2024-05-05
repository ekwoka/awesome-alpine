import type { PluginCallback } from 'alpinejs';

import { Toast } from './Toast.ts';

export const Toasts: PluginCallback = (Alpine) => {
  let toastId = 0;
  const toasterTimeout = 1000;

  const toastManager = Alpine.reactive<ToastManager>({
    queue: [] as Toast[],
    /**
     * Add a toast to the queue, and show it
     * @param {String} message
     * @param {String} type = 'info | success | warning | error'
     * @param {Number} timeout = '0 | n' (milliseconds) 0 means permanent
     * @returns {Toast | void} Toast object if successful
     */
    show(
      message: string,
      type: string = 'info',
      timeout: number = toasterTimeout,
    ): Toast | void {
      if (!message) {
        return console.error('$toasts.show requires a message');
      }

      const toast = Alpine.reactive(new Toast(toastId++, message, type));

      this.queue.push(toast);
      Alpine.nextTick(() => toast.show().hide(timeout));
      return toast;
    },

    /**
     * Clears a toast from the queue
     * @param {Toast} toast to dismiss
     * @returns {Boolean} true if toast was removed
     */
    clearFromQueue(toast: Toast): boolean {
      if (toast.shown) return false;
      toast.clear();
      const toastIndex = this.queue.indexOf(toast);
      if (toastIndex > -1) this.queue.splice(toastIndex, 1);
      return true;
    },
    /**
     * Begins timer to hide Toast
     * @param {Toast} toast
     * @returns {Number | void} TimeoutId if timeout present
     */
    hide(toast: Toast): ReturnType<typeof setTimeout> | void {
      toast.hide(toasterTimeout);
    },

    /**
     * Hide passed toast immediately
     * @param {Toast} toast
     */
    dismiss(toast: Toast) {
      toast.dismiss();
    },
  });
  Alpine.$toasts = toastManager;
  Alpine.magic('toasts', () => toastManager);
};

export default Toasts;

declare module 'alpinejs' {
  interface Alpine {
    $toasts: ToastManager;
  }
}

type ToastManager = {
  queue: Toast[];
  show: (message: string, type?: string, timeout?: number) => Toast | void;
  clearFromQueue: (toast: Toast) => boolean;
  hide: (toast: Toast) => ReturnType<typeof setTimeout> | void;
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
