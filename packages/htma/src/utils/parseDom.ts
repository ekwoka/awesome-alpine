export const parseDom = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html');
