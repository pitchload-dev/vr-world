import { getStore } from '@netlify/blobs';
import {
  createInterestHandler,
  type InterestStore,
} from '../../server/interests';
import { configuredPasswordHash } from '../../server/interest-password';

export default async function handler(
  request: Request,
  context: { ip?: string },
) {
  const blobs = getStore({
    name: 'kit-investment-interest',
    consistency: 'strong',
  });
  const store: InterestStore = {
    async get<T>(key: string) {
      const value = await blobs.getWithMetadata(key, { type: 'json' });
      if (value && !value.etag) throw new Error('Store version unavailable');
      return value ? { data: value.data as T, etag: value.etag! } : null;
    },
    async put(key, data, etag) {
      const result = await blobs.setJSON(
        key,
        data,
        etag === null ? { onlyIfNew: true } : { onlyIfMatch: etag },
      );
      return result.modified;
    },
  };
  return createInterestHandler(
    store,
    process.env.INTEREST_ADMIN_PASSWORD_HASH || configuredPasswordHash,
  )(request, context.ip || 'unknown');
}
