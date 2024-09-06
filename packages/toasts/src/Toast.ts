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
    public options: ToastOptionsSet = {},
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

export type ToastOptions = ToastOptionsSet & {
  success: ToastOptionsSet;
  error: ToastOptionsSet;
  loading: ToastOptionsSet;
  custom: ToastOptionsSet;
};

export type ToastOptionsSet = Partial<{
  /**
   * How long to display the toast before automatically dismissing
   * @type {number}
   */
  duration: number;

  /**
   * Whether the toast can be dismissed by clicking on it
   * @type {boolean}
   */
  dismissible: boolean;

  /**
   * Styles to apply inline on the toast
   * @type {CSSStyleDeclaration}
   */
  style: CSSStyleDeclaration;
  /**
   * Class to apply to the toast
   * @type {string}
   */
  className: string;

  /**
   * Icon to display on the toast
   * safe html
   * @type {string}
   */
  icon: string;

  /**
   * Change colors of default success/error/loading icon
   * hex color code
   * @type {object}
   * @property {string} primary
   * @property {string} secondary
   */
  iconTheme: {
    primary: string;
    secondary: string;
  };

  /**
   * Attributes to apply to the toast
   * @type {Record<string, string>}
   */
  attrs: Record<string, string>;
}>;
