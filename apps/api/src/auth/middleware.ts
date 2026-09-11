import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiKeyRecord, KeyStore } from './keys.js';
import { unauthorized } from '../errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated key record, or null for anonymous requests. */
    apiKey: ApiKeyRecord | null;
  }
}

const HEADER = 'x-api-key';

/**
 * Header validation for `x-api-key`. Keys are optional on public reads —
 * anonymous callers proceed as `free` — but a present-but-unknown key is
 * rejected so leaked or revoked keys fail loudly.
 */
export async function registerAuth(app: FastifyInstance, keys: KeyStore): Promise<void> {
  await app.decorateRequest('apiKey', null);

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const raw = request.headers[HEADER];
    if (raw === undefined) {
      request.apiKey = null;
      return;
    }
    const presented = Array.isArray(raw) ? raw[0] : raw;
    if (!presented) {
      request.apiKey = null;
      return;
    }
    const record = keys.verify(presented);
    if (record === null) {
      unauthorized(reply, 'Invalid or revoked API key.');
      return;
    }
    request.apiKey = record;
  });
}
