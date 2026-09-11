import type { FastifyInstance } from 'fastify';
import { listSwapsQuerySchema, recentSwapsQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, zodMessage } from '../errors.js';

/** Swap activity endpoints (PRD §17 swaps) with asset/protocol filters. */
export async function swapRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/swaps', async (request, reply) => {
    const parsed = listSwapsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { asset, protocol, pool, page, limit } = parsed.data;
    const result = source.listSwaps({
      ...(asset !== undefined ? { asset } : {}),
      ...(pool !== undefined ? { pool } : {}),
      ...(protocol !== undefined ? { protocol } : {}),
      page,
      limit,
    });
    await reply.send({ data: result.data, page, limit, total: result.total });
  });

  app.get('/v1/swaps/recent', async (request, reply) => {
    const parsed = recentSwapsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { asset, protocol, limit } = parsed.data;
    await reply.send(
      source.recentSwaps(limit, {
        ...(asset !== undefined ? { asset } : {}),
        ...(protocol !== undefined ? { protocol } : {}),
      }),
    );
  });
}
