import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ApiEnv } from './env.js';
import type { DataSource } from './data/source.js';
import { registerRoutes } from './routes/index.js';
import { sendError } from './errors.js';

export interface BuildAppOptions {
  env: ApiEnv;
  source: DataSource;
}

/** Fastify application factory (injectable source keeps routes testable). */
export async function buildApp({ env, source }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: env.logLevel } });

  await app.register(cors, { origin: true });

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

  return app;
}
