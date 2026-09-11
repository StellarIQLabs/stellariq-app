import type { FastifyInstance } from 'fastify';
import { getPoolParamsSchema, listPoolsQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';

/** Pool endpoints (PRD §17 pools) exposing reserves, TVL and analytics. */
export async function poolRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/pools', async (request, reply) => {
    const parsed = listPoolsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { protocol, sort, page, limit } = parsed.data;
    const result = source.listPools({
      ...(protocol !== undefined ? { protocol } : {}),
      sort,
      page,
      limit,
    });
    await reply.send({ data: result.data, page, limit, total: result.total });
  });

  app.get('/v1/pools/:pool', async (request, reply) => {
    const parsed = getPoolParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const pool = source.getPool(parsed.data.pool);
    if (pool === null) {
      notFound(reply, `Unknown pool "${parsed.data.pool}".`);
      return;
    }
    await reply.send(pool);
  });
}
