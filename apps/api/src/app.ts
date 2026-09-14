import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ApiEnv } from './env.js';
import type { DataSource } from './data/source.js';
import { registerRoutes } from './routes/index.js';
import { registerWsGateway } from './ws/gateway.js';
import { registerAuth } from './auth/middleware.js';
import { createRateStore, registerRateLimit } from './auth/rateLimit.js';
import { MAX_BODY_BYTES, registerSecurity } from './security.js';
import { KeyStore } from './auth/keys.js';
import { FileKeyPersistence } from './auth/fileStore.js';
import { keyRoutes } from './routes/keys.js';
import { sendError } from './errors.js';

export interface BuildAppOptions {
  env: ApiEnv;
  source: DataSource;
}

/** Fastify application factory (injectable source keeps routes testable). */
export async function buildApp({ env, source }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: env.logLevel }, bodyLimit: MAX_BODY_BYTES });

  await app.register(cors, { origin: true });
  await registerSecurity(app);

  app.setErrorHandler((err, _request, reply) => {
    app.log.error(err);
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    sendError(
      reply,
      statusCode,
      statusCode === 500 ? 'Internal Server Error' : 'Request Error',
      'Unexpected server error.',
    );
  });

  app.setNotFoundHandler((_request, reply) => {
    sendError(reply, 404, 'Not Found', 'Unknown endpoint. See /docs in the OpenAPI task.');
  });

  await registerRoutes(app, source);
  await registerWsGateway(app, source);

  const persistence = env.keyStorePath ? new FileKeyPersistence(env.keyStorePath) : undefined;
  const keys = new KeyStore(env.apiKeySalt, persistence);
  await registerAuth(app, keys);
  const rateStore = await createRateStore(app, env.redisUrl);
  await registerRateLimit(app, rateStore);
  app.addHook('onClose', async () => {
    await rateStore.close();
  });
  await keyRoutes(app, keys, env);
  if (env.seedDevKeys) {
    for (const issued of keys.seedDevKeys()) {
      app.log.warn(
        { prefix: issued.record.prefix, tier: issued.record.tier },
        'seeded dev API key',
      );
    }
  }

  return app;
}
