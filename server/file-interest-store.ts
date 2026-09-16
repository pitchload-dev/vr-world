import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { InterestStore } from './interests';
type Records = Record<string, { data: unknown; etag: string }>;
// Only for the single-process local preview. Production uses Netlify Blobs.
export function fileInterestStore(path: string): InterestStore {
  let queue = Promise.resolve();
  async function read(): Promise<Records> {
    try {
      return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw error;
    }
  }
  return {
    async get<T>(key: string) {
      const value = (await read())[key];
      return value ? { data: value.data as T, etag: value.etag } : null;
    },
    async put(key, data, etag) {
      let modified = false;
      const task = queue.then(async () => {
        const records = await read();
        if ((records[key]?.etag ?? null) !== etag) return;
        records[key] = { data, etag: crypto.randomUUID() };
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        await writeFile(path + '.tmp', JSON.stringify(records), {
          mode: 0o600,
        });
        await rename(path + '.tmp', path);
        modified = true;
      });
      queue = task.catch(() => {});
      await task;
      return modified;
    },
  };
}
