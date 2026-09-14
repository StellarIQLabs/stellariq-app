import type { FastifyInstance } from 'fastify';
import { getMarketParamsSchema, listMarketsQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';

/** Market endpoints (PRD §17 markets) aggregating protocols into pair views. */
export async function marketRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/markets', async (request, reply) => {
    const parsed = listMarketsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { protocol, sort, page, limit } = parsed.data;
    const result = await source.listMarkets({
      ...(protocol !== undefined ? { protocol } : {}),
      sort,
      page,
      limit,
    });
    await reply.send({ data: result.data, page, limit, total: result.total });
  });

  app.get('/v1/markets/:pair', async (request, reply) => {
    const parsed = getMarketParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const market = await source.getMarket(parsed.data.pair);
    if (market === null) {
      notFound(reply, `Unknown market pair "${parsed.data.pair}".`);
      return;
    }
    await reply.send(market);
  });
}
