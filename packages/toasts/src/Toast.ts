export class Toast implements ToastControls {
  /**
   * Whether the toast is shown
   * @type {Boolean}
   */
  shown: boolean = true;

  /**
   * Timeout ID for hiding the toast
   * @type {Number}
   */
  timeoutId?: ReturnType<typeof setTimeout>;

  constructor(
    public id: number,
    public type: string = 'info',
    public message: string,
    public details: ToastDetails = {},
  ) {}

  /**
   * Shows the Toast
   * @returns {Toast} this
   */
  show(): this {
    this.shown = true;
    return this;
  }

  /**
   * Begins timer to hide Toast if timeout is greater than 0
   * @param {Number} timeout
   * @returns {Toast} this
   */
  hide(timeout: number): this {
    if (timeout > 0) {
      this.timeoutId = setTimeout(() => {
        this.shown = false;
      }, timeout);
    }
    return this;
  }

  /**
   * Hides the toast
   * @returns {Toast} this
   */
  dismiss(): this {
    clearTimeout(this.timeoutId);
    this.shown = false;
    return this;
  }

  /**
   * Clears the timeout for hiding the toast
   */
  clear(): void {
    clearTimeout(this.timeoutId);
  }
}

interface ToastControls {
  show(): this;
  clear(): void;
  hide(timeout: number): this;
  dismiss(): this;
}

export type ToastDetails = {
  /**
   * Timeout for hiding the toast automatically
   * @type {Number}
   */
  timeout?: number;
  [key: string]: unknown;
};
