import type { ToastOptions, ToastOptionsSet } from './Toast';

export const baseOptions: ToastOptionsSet = {
  dismissible: true,
  duration: 0,
  style: {} as CSSStyleDeclaration,
  className: 'alpine-toast',
  icon: '',
  iconTheme: {
    primary: '#fff',
    secondary: '#fff',
  },
  attrs: {},
};

export const successOptions: ToastOptionsSet = {
  duration: 2_000,
  icon: '✅',
  className: 'alpine-toast toast-success',
};

export const errorOptions: ToastOptionsSet = {
  duration: 5_000,
  icon: '❌',
  className: 'alpine-toast toast-error',
};

export const loadingOptions: ToastOptionsSet = {
  duration: 0,
  icon: '⏳',
  className: 'alpine-toast toast-loading',
};

export const customOptions: ToastOptionsSet = {
  duration: 0,
  icon: '',
  className: 'alpine-toast toast-custom',
};

export const defaultOptions: ToastOptions = {
  ...baseOptions,
  success: successOptions,
  error: errorOptions,
  loading: loadingOptions,
  custom: customOptions,
};
