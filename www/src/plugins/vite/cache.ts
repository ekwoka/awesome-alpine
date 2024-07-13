import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const cacheDir = join(process.cwd(), 'node_modules/.vite');
export const cache = {
  get: (id: string) =>
    readFile(
      join(
        cacheDir,
        `${encodeURI(id.replaceAll(/[.?]/g, '-').replaceAll('/', '_'))}.txt`,
      ),
      'utf-8',
    ),
  set: (id: string, data: string) =>
    writeFile(
      join(
        cacheDir,
        `${encodeURI(id.replaceAll(/[.?]/g, '-').replaceAll('/', '_'))}.txt`,
      ),
      data,
    ),
};
