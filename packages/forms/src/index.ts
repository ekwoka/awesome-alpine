import type { DirectiveCallback, PluginCallback } from 'alpinejs';
export const $form = Symbol('x-form');
export const Forms: PluginCallback = (Alpine) => {
  Alpine.addRootSelector(() => `[${Alpine.prefixed('form')}]`);
  const _constraintsMsg = [
    {
      state: 'valueMissing',
      type: 'text',
      msg: 'This field is required',
    },
    {
      state: 'valueMissing',
      type: 'select-one',
      msg: 'Please select an item from the list',
    },
    {
      state: 'typeMismatch',
      type: 'url',
      msg: 'Please enter a valid web address',
    },
    {
      state: 'typeMismatch',
      type: 'email',
      msg: 'Please enter a valid email address',
    },
    {
      state: 'badInput',
      type: 'number',
      msg: 'Please enter a number',
    },
    {
      state: 'tooShort',
      type: 'text',
      msg: 'Please enter a longer value',
    },
    {
      state: 'patternMismatch',
      type: 'text',
      msg: null,
    },
  ];
  const xFormHandlers = new Map<string, DirectiveCallback>();

  Alpine.directive('form', (el, directive, utilities) => {
    console.log('directive', directive.original);
    const value = directive.value || 'root';
    const handler = xFormHandlers.get(value) ?? console.error;
    if (handler) handler(el, directive, utilities);
  }).before('bind');

  xFormHandlers.set('root', (form, _directive, { Alpine }) => {
    Alpine.addScopeToNode(
      form,
      Alpine.reactive(
        scopedData('$form', {
          form,
        }),
      ),
    );
  });

  xFormHandlers.set('control', (el, _directive, { Alpine }) => {
    const els = getLabelAndControl(el);
    console.log(els);
    if (!els) return;
    if (els.label)
      Alpine.addScopeToNode(
        els.label,
        Alpine.reactive(
          scopedData('$control', {
            error: 'test',
          }),
        ),
      );
  });

  xFormHandlers.set('error', (el, _directive, { effect }) => {
    const data = Alpine.$data(el) as { $control: { error: string } };
    effect(() => {
      el.textContent = data.$control.error;
    });
  });
};

export default Forms;

const getLabelAndControl = (el: HTMLElement) => {
  if (el instanceof HTMLLabelElement)
    return { label: el, control: el.control as HTMLElement };
  if (isFormElement(el)) return { label: el.labels?.[0] ?? null, control: el };
};

const isFormElement = (
  el: HTMLElement & { form?: HTMLFormElement | null },
): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
  return 'form' in el;
};

const scopedData = (key: string, value: unknown, writable = false) =>
  Object.defineProperties(
    {},
    {
      [key]: {
        configurable: true,
        enumerable: false,
        value: value,
        writable,
      },
    },
  );
