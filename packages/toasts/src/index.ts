import type { PluginCallback } from 'alpinejs';

export const Toast: PluginCallback = (Alpine) => {
  let toastId = 0;
  const toasterTimeout = 5000;

  const toastManager = Alpine.reactive<ToastManager>({
    queue: [] as Toast[],
    /**
     * Add a toast to the queue, and show it
     * @param {String} message
     * @param {String} type = 'info | success | warning | error'
     * @param {Number} timeout = '0 | n' (milliseconds) 0 means permanent
     * @param {Boolean} dismissible
     */
    async show(
      message: string,
      type: string = 'info',
      timeout: number = toasterTimeout,
      dismissible: boolean = true,
    ) {
      if (!message) {
        return console.error('function showToast requires a message');
      }

      const toastData = Alpine.reactive({
        id: toastId++,
        message,
        type,
        show: false,
        timeout,
        dismissible,
      });

      this.queue.push(toastData);
      await Alpine.nextTick();
      toastData.show = true;
      this.hide(toastData);
      return toastData;
    },

    /**
     * Clears a toast from the queue
     * @param {Toast} toast
     * @returns {Boolean} true if toast was removed
     */
    clearFromQueue(toast: Toast): boolean {
      if (toast.show) return false;
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
      if (toast.timeout > 0) {
        return (toast.timeoutId = setTimeout(() => {
          toast.show = false;
        }, toast.timeout));
      }
    },

    /**
     * Hide passed toast immediately
     * @param {Toast} toast
     */
    dismiss(toast: Toast) {
      clearTimeout(toast.timeoutId);
      toast.show = false;
    },
  });
  Alpine.$toasts = toastManager;
  Alpine.magic('toasts', () => toastManager);
};

declare module 'alpinejs' {
  interface Alpine {
    $toasts: ToastManager;
  }
}

type Toast = {
  id: number;
  message: string;
  type: string;
  show: boolean;
  timeout: number;
  timeoutId?: ReturnType<typeof setTimeout>;
  dismissible: boolean;
};

type ToastManager = {
  queue: Toast[];
  show: (
    message: string,
    type?: string,
    timeout?: number,
    dismissible?: boolean,
  ) => Promise<Toast | void>;
  clearFromQueue: (toast: Toast) => boolean;
  hide: (toast: Toast) => ReturnType<typeof setTimeout> | void;
  dismiss: (toast: Toast) => void;
};

/* Initialize Toast Queue with any loading toasts from queryParams */
export const InitializeParams: PluginCallback = (Alpine) => {
  const toastParamKeys = [
    'message',
    'type',
    'timeout',
    'dismissible',
    'hasCopyAction',
  ];
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
