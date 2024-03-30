export const findLocalLink = (el: Element): HTMLAnchorElement | null => {
  const selector = CSS.supports('selector(:local-link)')
    ? 'a:local-link'
    : `a[href*="${window.location.pathname}"]`;
  return el.querySelector(selector);
};
