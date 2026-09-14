import type { FastifyInstance } from 'fastify';
import { getPriceParamsSchema, priceHistoryQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';

/** Aggregated price endpoints (PRD §17 prices) with confidence and timestamp. */
export async function priceRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/prices/:asset', async (request, reply) => {
    const parsed = getPriceParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const price = await source.getPrice(parsed.data.asset);
    if (price === null) {
      notFound(reply, `No price for unknown asset "${parsed.data.asset}".`);
      return;
    }
    await reply.send(price);
  });

  app.get('/v1/prices/:asset/history', async (request, reply) => {
    const paramsParsed = getPriceParamsSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      badRequest(reply, zodMessage(paramsParsed.error));
      return;
    }
    const queryParsed = priceHistoryQuerySchema.safeParse(request.query);
    if (!queryParsed.success) {
      badRequest(reply, zodMessage(queryParsed.error));
      return;
    }
    if ((await source.getPrice(paramsParsed.data.asset)) === null) {
      notFound(reply, `No price history for unknown asset "${paramsParsed.data.asset}".`);
      return;
    }
    await reply.send(
      await source.priceHistory(paramsParsed.data.asset, queryParsed.data.timeframe),
    );
  });
}
