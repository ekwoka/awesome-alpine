import type { Plugin } from 'vite';
import { cache } from './cache';

export const DLX = (): Plugin => ({
  name: 'dlx',
  resolveId(id: string) {
    if (id.includes('?dlx')) {
      return id;
    }
  },
  async load(id: string) {
    if (id.includes('?dlx')) {
      try {
        return await cache.get(id);
      } catch (_) {
        this.info('Cache miss for ' + id);
      }
      this.info(`downloading script from ${id}...`);
      const res = await fetch('https://' + id);
      const text = await res.text();
      this.info(`downloaded script from ${id}...`);
      this.info(`size: ${text.length} bytes`);
      const result = id.includes('&json')
        ? `export default JSON.parse(${JSON.stringify(text)})`
        : text;
      await cache.set(id, result);
      return result;
    }
  },
});

export const URL = (): Plugin => ({
  name: 'dlx',
  resolveId(id: string) {
    if (id.includes('?urlfollow')) {
      return id;
    }
  },
  async load(id: string) {
    if (id.includes('?urlfollow')) {
      id = id.replace('?urlfollow', '');
      try {
        return await cache.get(id);
      } catch (_) {
        this.info('Cache miss for ' + id);
      }
      this.info(`getting current url for ${id}...`);
      const response = await fetch('https://' + id, {
        redirect: 'manual',
      });
      if ([302, 301].includes(response.status)) {
        const redirect = response.headers.get('location');
        if (redirect) {
          console.log('Using Redirected location for: ', id, ' at: ', redirect);
          const result = `export const url = '${redirect}'`;
          await cache.set(id, result);
          return result;
        }
      }
      console.log('url not redirected. Using default:', id);
      const result = `export const url = 'https://${id}'`;
      await cache.set(id, result);
      return result;
    }
  },
});
