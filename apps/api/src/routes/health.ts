import { createRequire } from 'node:module';
import type { FastifyInstance } from 'fastify';
import type { DataSource } from '../data/source.js';
import { sendError } from '../errors.js';

const require = createRequire(import.meta.url);
const { version }: { version: string } = require('../../package.json') as { version: string };
const startedAt = Date.now();

/**
 * Liveness and readiness probes for infra monitors (PRD §29 availability).
 * `/ready` fails closed (503) when the downstream data layer is unreachable.
 */
export async function healthRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/health', async (_request, reply) => {
    await reply.send({
      status: 'ok',
      version,
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    });
  });

  app.get('/ready', async (_request, reply) => {
    try {
      const probe = await source.listAssets({ page: 1, limit: 1 });
      const assets = probe.total;
      await reply.send({ status: 'ready', version, checks: { data: 'ok', assets } });
    } catch (err: unknown) {
      app.log.error(err, 'readiness probe failed');
      sendError(reply, 503, 'Service Unavailable', 'Downstream data layer is unreachable.');
    }
  });
}
